import "server-only";

import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
  type GetObjectCommandOutput,
  type ListObjectsV2Output,
} from "@aws-sdk/client-s3";

const DEFAULT_TOTALS_PREFIX = "total/";
const LIST_TIMEOUT_MS = 5_000;
const GET_TIMEOUT_MS = 10_000;
const MAX_LIST_PAGES = 10;
const MAX_TOTALS_CSV_BYTES = 25 * 1024 * 1024;

type ListedObject = NonNullable<ListObjectsV2Output["Contents"]>[number];
type GetObjectBody = NonNullable<GetObjectCommandOutput["Body"]>;

export type TotalsObjectDescriptor = {
  bucket: string;
  region: string;
  key: string;
  etag?: string;
  identity: string;
  lastModified: Date;
  sizeBytes: number;
};

export type DownloadedTotalsCsv = {
  csv: string;
  object: TotalsObjectDescriptor;
};

export class AnalyticsS3ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyticsS3ConfigurationError";
  }
}

export class AnalyticsS3ObjectTooLargeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalyticsS3ObjectTooLargeError";
  }
}

const getAnalyticsS3Config = () => {
  const bucket = process.env.SELFIE_CHECK_ANALYTICS_S3_BUCKET_NAME;
  const region = process.env.SELFIE_CHECK_ANALYTICS_S3_REGION;
  const totalsPrefix =
    process.env.SELFIE_CHECK_ANALYTICS_TOTALS_PREFIX ?? DEFAULT_TOTALS_PREFIX;

  if (!bucket) {
    throw new AnalyticsS3ConfigurationError(
      "SELFIE_CHECK_ANALYTICS_S3_BUCKET_NAME is not configured.",
    );
  }

  if (!region) {
    throw new AnalyticsS3ConfigurationError(
      "SELFIE_CHECK_ANALYTICS_S3_REGION is not configured.",
    );
  }

  return { bucket, region, totalsPrefix };
};

const clientsByRegion = new Map<string, S3Client>();

const getAnalyticsS3Client = (region: string) => {
  const existing = clientsByRegion.get(region);
  if (existing) return existing;

  const client = new S3Client({ region, maxAttempts: 2 });
  clientsByRegion.set(region, client);
  return client;
};

const isUsableCsvObject = (
  object: ListedObject,
): object is ListedObject & {
  Key: string;
  LastModified: Date;
  Size: number;
} =>
  Boolean(
    object.Key?.endsWith(".csv") &&
      object.LastModified &&
      typeof object.Size === "number" &&
      object.Size > 0,
  );

const isNewerObject = (candidate: ListedObject, current?: ListedObject) => {
  if (!candidate.LastModified) return false;
  if (!current?.LastModified) return true;

  const timestampDifference =
    candidate.LastModified.getTime() - current.LastModified.getTime();

  if (timestampDifference !== 0) return timestampDifference > 0;

  return Boolean(
    candidate.Key &&
      current.Key &&
      candidate.Key.localeCompare(current.Key) > 0,
  );
};

const buildObjectDescriptor = ({
  bucket,
  region,
  object,
}: {
  bucket: string;
  region: string;
  object: ListedObject & {
    Key: string;
    LastModified: Date;
    Size: number;
  };
}): TotalsObjectDescriptor => {
  const revision =
    object.ETag ?? `${object.LastModified.toISOString()}:${object.Size}`;

  return {
    bucket,
    region,
    key: object.Key,
    etag: object.ETag,
    identity: `${object.Key}:${revision}`,
    lastModified: object.LastModified,
    sizeBytes: object.Size,
  };
};

/**
 * Finds the most recently modified, non-empty CSV under the totals prefix.
 *
 * S3 lists keys lexicographically rather than by modification time, so every
 * returned page must be inspected. The page cap makes retention mistakes fail
 * explicitly instead of turning a request into unbounded listing work.
 */
export const findLatestTotalsObject =
  async (): Promise<TotalsObjectDescriptor> => {
    const { bucket, region, totalsPrefix } = getAnalyticsS3Config();
    const client = getAnalyticsS3Client(region);

    let continuationToken: string | undefined;
    let latest: ListedObject | undefined;
    let pageCount = 0;

    do {
      pageCount += 1;
      if (pageCount > MAX_LIST_PAGES) {
        throw new Error(
          `S3 totals prefix exceeded the ${MAX_LIST_PAGES}-page listing limit: ` +
            `bucket=${bucket}, prefix=${totalsPrefix}`,
        );
      }

      let page: ListObjectsV2Output;
      try {
        page = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: totalsPrefix,
            ContinuationToken: continuationToken,
          }),
          { abortSignal: AbortSignal.timeout(LIST_TIMEOUT_MS) },
        );
      } catch (error) {
        throw new Error(
          `Failed to list S3 totals objects: bucket=${bucket}, prefix=${totalsPrefix}`,
          { cause: error },
        );
      }

      for (const object of page.Contents ?? []) {
        if (isUsableCsvObject(object) && isNewerObject(object, latest)) {
          latest = object;
        }
      }

      if (page.IsTruncated && !page.NextContinuationToken) {
        throw new Error(
          `S3 returned a truncated totals listing without a continuation token: ` +
            `bucket=${bucket}, prefix=${totalsPrefix}`,
        );
      }

      continuationToken = page.IsTruncated
        ? page.NextContinuationToken
        : undefined;
    } while (continuationToken);

    if (!latest || !isUsableCsvObject(latest)) {
      throw new Error(
        `No non-empty totals CSV found: bucket=${bucket}, prefix=${totalsPrefix}`,
      );
    }

    return buildObjectDescriptor({ bucket, region, object: latest });
  };

const readBodyWithinLimit = async (
  body: GetObjectBody,
  maxBytes: number,
): Promise<Buffer> => {
  const stream = body as AsyncIterable<Uint8Array | string> & {
    destroy?: () => void;
  };
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;

    if (totalBytes > maxBytes) {
      stream.destroy?.();
      throw new AnalyticsS3ObjectTooLargeError(
        `Totals CSV exceeded the ${maxBytes}-byte download limit.`,
      );
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks, totalBytes);
};

/** Downloads a previously discovered totals object with a bounded body size. */
export const downloadTotalsCsv = async (
  descriptor: TotalsObjectDescriptor,
): Promise<DownloadedTotalsCsv> => {
  if (descriptor.sizeBytes > MAX_TOTALS_CSV_BYTES) {
    throw new AnalyticsS3ObjectTooLargeError(
      `Totals CSV exceeds the ${MAX_TOTALS_CSV_BYTES}-byte limit: ` +
        `key=${descriptor.key}, bytes=${descriptor.sizeBytes}`,
    );
  }

  const client = getAnalyticsS3Client(descriptor.region);
  let response: GetObjectCommandOutput;

  try {
    response = await client.send(
      new GetObjectCommand({
        Bucket: descriptor.bucket,
        Key: descriptor.key,
        // Prevent parsing a different object if the producer overwrites the key
        // between LIST and GET. Immutable hourly keys remain the preferred shape.
        IfMatch: descriptor.etag,
      }),
      { abortSignal: AbortSignal.timeout(GET_TIMEOUT_MS) },
    );
  } catch (error) {
    throw new Error(
      `Failed to download S3 totals object: bucket=${descriptor.bucket}, key=${descriptor.key}`,
      { cause: error },
    );
  }

  if (!response.Body) {
    throw new Error(
      `S3 totals object has no body: bucket=${descriptor.bucket}, key=${descriptor.key}`,
    );
  }

  if (
    typeof response.ContentLength === "number" &&
    response.ContentLength > MAX_TOTALS_CSV_BYTES
  ) {
    (response.Body as { destroy?: () => void }).destroy?.();
    throw new AnalyticsS3ObjectTooLargeError(
      `Downloaded totals CSV exceeds the ${MAX_TOTALS_CSV_BYTES}-byte limit: ` +
        `key=${descriptor.key}, bytes=${response.ContentLength}`,
    );
  }

  const body = await readBodyWithinLimit(response.Body, MAX_TOTALS_CSV_BYTES);
  if (body.byteLength === 0) {
    throw new Error(
      `Downloaded totals CSV is empty: bucket=${descriptor.bucket}, key=${descriptor.key}`,
    );
  }

  let csv: string;
  try {
    csv = new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch (error) {
    throw new Error(`Totals CSV is not valid UTF-8: key=${descriptor.key}`, {
      cause: error,
    });
  }

  const etag = response.ETag ?? descriptor.etag;
  const sizeBytes = body.byteLength;
  const revision =
    etag ?? `${descriptor.lastModified.toISOString()}:${sizeBytes}`;

  return {
    csv,
    object: {
      ...descriptor,
      etag,
      identity: `${descriptor.key}:${revision}`,
      sizeBytes,
    },
  };
};
