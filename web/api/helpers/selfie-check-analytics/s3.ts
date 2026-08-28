import "server-only";

import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
  type GetObjectCommandOutput,
  type ListObjectsV2Output,
} from "@aws-sdk/client-s3";

export const TABLE_PREFIXES = ["total/", "daily/"] as const;
export type TablePrefix = (typeof TABLE_PREFIXES)[number];

const TABLE_FILE_NAME_PATTERN =
  /^data_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.csv$/;
const LIST_TIMEOUT_MS = 5_000;
const GET_TIMEOUT_MS = 10_000;
const MAX_LIST_PAGES = 10;
const MAX_CSV_BYTES = 25 * 1024 * 1024;

type ListedObject = NonNullable<ListObjectsV2Output["Contents"]>[number];
type GetObjectBody = NonNullable<GetObjectCommandOutput["Body"]>;

export type TableObjectDescriptor = {
  bucket: string;
  region: string;
  key: string;
  etag?: string;
  identity: string;
  dataAsOf: Date;
  lastModified: Date;
  sizeBytes: number;
};

export type DownloadedTableCsv = {
  csv: string;
  object: TableObjectDescriptor;
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

  return { bucket, region };
};

const clientsByRegion = new Map<string, S3Client>();

const getAnalyticsS3Client = (region: string) => {
  const existing = clientsByRegion.get(region);
  if (existing) return existing;

  const client = new S3Client({ region, maxAttempts: 2 });
  clientsByRegion.set(region, client);
  return client;
};

type TableObjectCandidate = {
  dataAsOf: Date;
  object: ListedObject & {
    Key: string;
    LastModified: Date;
    Size: number;
  };
};

/** Validates the filename shape and extracts its UTC dataset timestamp. */
const parseDataAsOfFromKey = (key: string, prefix: string): Date | null => {
  if (!key.startsWith(prefix)) return null;

  const fileName = key.slice(prefix.length);
  const match = TABLE_FILE_NAME_PATTERN.exec(fileName);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const isoTimestamp = `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
  const dataAsOf = new Date(isoTimestamp);

  // Date parsing may normalize impossible values such as February 30. Only
  // accept the filename when every component round-trips unchanged.
  if (
    Number.isNaN(dataAsOf.getTime()) ||
    dataAsOf.toISOString() !== isoTimestamp
  ) {
    return null;
  }

  return dataAsOf;
};

const toTableObjectCandidate = (
  object: ListedObject,
  prefix: string,
): TableObjectCandidate | null => {
  const dataAsOf = object.Key ? parseDataAsOfFromKey(object.Key, prefix) : null;

  if (
    !dataAsOf ||
    !object.Key ||
    !object.LastModified ||
    typeof object.Size !== "number" ||
    object.Size <= 0
  ) {
    return null;
  }

  return {
    dataAsOf,
    object: object as ListedObject & {
      Key: string;
      LastModified: Date;
      Size: number;
    },
  };
};

const isNewerObject = (
  candidate: TableObjectCandidate,
  current?: TableObjectCandidate,
) => {
  if (!current) return true;

  const timestampDifference =
    candidate.dataAsOf.getTime() - current.dataAsOf.getTime();

  if (timestampDifference !== 0) return timestampDifference > 0;

  return candidate.object.Key.localeCompare(current.object.Key) > 0;
};

const buildObjectDescriptor = ({
  bucket,
  region,
  candidate,
}: {
  bucket: string;
  region: string;
  candidate: TableObjectCandidate;
}): TableObjectDescriptor => {
  const { dataAsOf, object } = candidate;
  const revision =
    object.ETag ?? `${object.LastModified.toISOString()}:${object.Size}`;

  return {
    bucket,
    region,
    key: object.Key,
    etag: object.ETag,
    identity: `${object.Key}:${revision}`,
    dataAsOf,
    lastModified: object.LastModified,
    sizeBytes: object.Size,
  };
};

/**
 * Finds the newest non-empty timestamped CSV under `total/` or `daily/`.
 *
 * Bucket and region come from env. Prefix is the only call-site variable.
 * S3 lists keys lexicographically rather than by modification time, so every
 * returned page must be inspected. The page cap makes retention mistakes fail
 * explicitly instead of turning a request into unbounded listing work.
 */
export const listCsv = async (
  prefix: string,
): Promise<TableObjectDescriptor> => {
  const { bucket, region } = getAnalyticsS3Config();
  const client = getAnalyticsS3Client(region);

  let continuationToken: string | undefined;
  let latest: TableObjectCandidate | undefined;
  let pageCount = 0;

  do {
    pageCount += 1;
    if (pageCount > MAX_LIST_PAGES) {
      throw new Error(
        `S3 prefix exceeded the ${MAX_LIST_PAGES}-page listing limit: ` +
          `bucket=${bucket}, prefix=${prefix}`,
      );
    }

    let page: ListObjectsV2Output;
    try {
      page = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
        { abortSignal: AbortSignal.timeout(LIST_TIMEOUT_MS) },
      );
    } catch (error) {
      throw new Error(
        `Failed to list S3 CSV objects: bucket=${bucket}, prefix=${prefix}`,
        { cause: error },
      );
    }

    for (const object of page.Contents ?? []) {
      const candidate = toTableObjectCandidate(object, prefix);
      if (candidate && isNewerObject(candidate, latest)) {
        latest = candidate;
      }
    }

    if (page.IsTruncated && !page.NextContinuationToken) {
      throw new Error(
        `S3 returned a truncated listing without a continuation token: ` +
          `bucket=${bucket}, prefix=${prefix}`,
      );
    }

    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
  } while (continuationToken);

  if (!latest) {
    throw new Error(
      `No non-empty timestamped CSV found: bucket=${bucket}, prefix=${prefix}`,
    );
  }

  return buildObjectDescriptor({ bucket, region, candidate: latest });
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
        `CSV exceeded the ${maxBytes}-byte download limit.`,
      );
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks, totalBytes);
};

/** Downloads a previously listed CSV object with a bounded body size. */
export const downloadCsv = async (
  descriptor: TableObjectDescriptor,
): Promise<DownloadedTableCsv> => {
  if (descriptor.sizeBytes > MAX_CSV_BYTES) {
    throw new AnalyticsS3ObjectTooLargeError(
      `CSV exceeds the ${MAX_CSV_BYTES}-byte limit: ` +
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
      `Failed to download S3 object: bucket=${descriptor.bucket}, key=${descriptor.key}`,
      { cause: error },
    );
  }

  if (!response.Body) {
    throw new Error(
      `S3 object has no body: bucket=${descriptor.bucket}, key=${descriptor.key}`,
    );
  }

  if (
    typeof response.ContentLength === "number" &&
    response.ContentLength > MAX_CSV_BYTES
  ) {
    (response.Body as { destroy?: () => void }).destroy?.();
    throw new AnalyticsS3ObjectTooLargeError(
      `Downloaded CSV exceeds the ${MAX_CSV_BYTES}-byte limit: ` +
        `key=${descriptor.key}, bytes=${response.ContentLength}`,
    );
  }

  const body = await readBodyWithinLimit(response.Body, MAX_CSV_BYTES);
  if (body.byteLength === 0) {
    throw new Error(
      `Downloaded CSV is empty: bucket=${descriptor.bucket}, key=${descriptor.key}`,
    );
  }

  let csv: string;
  try {
    csv = new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch (error) {
    throw new Error(`CSV is not valid UTF-8: key=${descriptor.key}`, {
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
