import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  createPresignedPost,
  type PresignedPost,
} from "@aws-sdk/s3-presigned-post";
import { lookup } from "node:dns/promises";
import { request as httpsRequest, type RequestOptions } from "node:https";
import { isIP } from "node:net";

// Image-type identifier the dashboard / Hasura action / MCP all share. The
// values match the basenames the dashboard uses on disk so the existing image
// upload flow keeps working.
export const APP_IMAGE_BASENAMES = {
  logo_img: "logo_img",
  hero_image: "hero_image",
  content_card_image: "content_card_image",
  meta_tag_image: "meta_tag_image",
  showcase_img_1: "showcase_img_1",
  showcase_img_2: "showcase_img_2",
  showcase_img_3: "showcase_img_3",
} as const;

export type AppImageBasename = keyof typeof APP_IMAGE_BASENAMES;

// MCP-facing alias map: short, human-friendly image_type values that map onto
// the basenames + the app_metadata column the upload should patch.
export const MCP_APP_IMAGE_MAP = {
  logo: { basename: "logo_img", field: "logo_img_url" },
  hero: { basename: "hero_image", field: "hero_image_url" },
  content_card: {
    basename: "content_card_image",
    field: "content_card_image_url",
  },
  meta_tag: { basename: "meta_tag_image", field: "meta_tag_image_url" },
  showcase_1: {
    basename: "showcase_img_1",
    field: "showcase_img_urls",
    arrayIndex: 0,
  },
  showcase_2: {
    basename: "showcase_img_2",
    field: "showcase_img_urls",
    arrayIndex: 1,
  },
  showcase_3: {
    basename: "showcase_img_3",
    field: "showcase_img_urls",
    arrayIndex: 2,
  },
} as const;

export type McpAppImageType = keyof typeof MCP_APP_IMAGE_MAP;

export const MAX_APP_IMAGE_BYTES = 500 * 1024;

const normalizeExtension = (contentTypeEnding: string) =>
  contentTypeEnding === "jpeg" ? "jpg" : contentTypeEnding;

export const buildAppImageObjectKey = ({
  appId,
  fileName,
  locale,
}: {
  appId: string;
  fileName: string;
  locale?: string;
}) => {
  const localePrefix = locale && locale !== "en" ? `${locale}/` : "";
  return `unverified/${appId}/${localePrefix}${fileName}`;
};

const getS3Config = () => {
  const region = process.env.ASSETS_S3_REGION;
  const bucket = process.env.ASSETS_S3_BUCKET_NAME;
  if (!region) {
    throw new Error("ASSETS_S3_REGION is not configured.");
  }
  if (!bucket) {
    throw new Error("ASSETS_S3_BUCKET_NAME is not configured.");
  }
  return { region, bucket };
};

/**
 * Generate a presigned multipart POST that callers can use to upload directly
 * to S3 from the browser (or any client). Used by the Hasura upload-image
 * action. Mirrors the dashboard's upload contract.
 */
export const generateAppImagePresignedPost = async ({
  appId,
  imageType,
  contentTypeEnding,
  locale,
}: {
  appId: string;
  imageType: string;
  contentTypeEnding: string;
  locale?: string;
}): Promise<PresignedPost> => {
  const { region, bucket } = getS3Config();
  const client = new S3Client({ region });
  const ext = normalizeExtension(contentTypeEnding);
  const fileName = `${imageType}.${ext}`;
  const objectKey = buildAppImageObjectKey({ appId, fileName, locale });
  const contentType = `image/${contentTypeEnding}`;
  return createPresignedPost(client, {
    Bucket: bucket,
    Key: objectKey,
    Expires: 600, // 10 minutes
    Conditions: [
      ["content-length-range", 0, MAX_APP_IMAGE_BYTES],
      ["eq", "$Content-Type", contentType],
    ],
  });
};

/**
 * Upload an image directly from the server (used by the MCP upload_app_image
 * tool). Returns the resulting object key + filename so the caller can patch
 * the matching app_metadata field.
 */
export const uploadAppImage = async ({
  appId,
  imageType,
  body,
  contentType,
  locale,
}: {
  appId: string;
  imageType: McpAppImageType;
  body: Buffer;
  contentType: "image/png" | "image/jpeg";
  locale?: string;
}) => {
  if (body.byteLength === 0) {
    throw new Error("Image is empty.");
  }
  if (body.byteLength > MAX_APP_IMAGE_BYTES) {
    throw new Error(
      `Image is ${body.byteLength} bytes; maximum is ${MAX_APP_IMAGE_BYTES} (500KB).`,
    );
  }

  const { region, bucket } = getS3Config();
  const client = new S3Client({ region });
  const ext = contentType === "image/png" ? "png" : "jpg";
  const mapping = MCP_APP_IMAGE_MAP[imageType];
  const fileName = `${mapping.basename}.${ext}`;
  const objectKey = buildAppImageObjectKey({ appId, fileName, locale });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    }),
  );

  return { fileName, objectKey, mapping, sizeBytes: body.byteLength };
};

/**
 * Best-effort delete of an object we just wrote, used to compensate when a
 * downstream step (e.g. an app_metadata GraphQL update) fails after the S3
 * PUT succeeded. Swallows errors — the caller has already decided to surface
 * the original failure; we just don't want orphaned bytes if we can help it.
 */
export const tryDeleteAppImage = async (objectKey: string): Promise<void> => {
  try {
    const { region, bucket } = getS3Config();
    const client = new S3Client({ region });
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }),
    );
  } catch {
    // intentionally ignored — the caller logs the original failure.
  }
};

// ---------------------------------------------------------------------------
// Source-image fetch + decode helpers (used by MCP upload_app_image).
//
// We need to (a) avoid SSRF when an authenticated caller asks the server to
// fetch an arbitrary URL, (b) cap the bytes we read so we don't OOM on a 1GB
// response, and (c) authoritatively detect the image format from the bytes
// themselves rather than trusting caller-provided metadata.
// ---------------------------------------------------------------------------

export class ImageInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageInputError";
  }
}

// Subclass for "we never received an HTTP response from this address" —
// connect refused, network unreachable, idle timeout before headers, etc.
// fetchImageFromUrl uses this to know whether retrying the next validated
// A/AAAA record could plausibly help. Once a host has responded (even with
// an error status or oversize body), trying a sibling address is pointless.
class ConnectError extends ImageInputError {
  constructor(message: string) {
    super(message);
    this.name = "ConnectError";
  }
}

export const detectImageContentType = (
  body: Buffer,
): "image/png" | "image/jpeg" | null => {
  if (body.length >= 8) {
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (
      body[0] === 0x89 &&
      body[1] === 0x50 &&
      body[2] === 0x4e &&
      body[3] === 0x47 &&
      body[4] === 0x0d &&
      body[5] === 0x0a &&
      body[6] === 0x1a &&
      body[7] === 0x0a
    ) {
      return "image/png";
    }
  }
  if (body.length >= 3) {
    // JPEG SOI marker: FF D8 FF (any third byte)
    if (body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff) {
      return "image/jpeg";
    }
  }
  return null;
};

// Convert any IPv4-mapped IPv6 form (dotted `::ffff:127.0.0.1` OR hex
// `::ffff:7f00:1`) back to the underlying dotted IPv4. Returns null for
// non-mapped IPv6.
const ipv4FromMapped = (ipv6: string): string | null => {
  const lower = ipv6.toLowerCase();
  // Some forms include an extra `::ffff:0:` prefix; normalize the leader to
  // `::ffff:` only.
  const mapped = lower.replace(/^::ffff:0+:/, "::ffff:");
  const dotted = mapped.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted) return isIP(dotted[1]) === 4 ? dotted[1] : null;
  const hex = mapped.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const high = parseInt(hex[1], 16);
    const low = parseInt(hex[2], 16);
    if (Number.isNaN(high) || Number.isNaN(low)) return null;
    const v4 = `${(high >> 8) & 0xff}.${high & 0xff}.${(low >> 8) & 0xff}.${low & 0xff}`;
    return isIP(v4) === 4 ? v4 : null;
  }
  return null;
};

const isPrivateIp = (addr: string, family: 4 | 6): boolean => {
  if (family === 4) {
    const parts = addr.split(".").map((n) => parseInt(n, 10));
    if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
    const [a, b] = parts;
    if (a === 10) return true; // RFC1918 10/8
    if (a === 127) return true; // loopback
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 169 && b === 254) return true; // link-local
    if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918 172.16/12
    if (a === 192 && b === 168) return true; // RFC1918 192.168/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  // IPv6 — check the well-known internal prefixes first, then fall through
  // to IPv4-mapped detection for any of the dotted/hex variants.
  const lower = addr.toLowerCase();
  if (lower === "::1" || lower === "::") return true; // loopback / unspec
  if (lower.startsWith("fe80:")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower.startsWith("ff")) return true; // multicast
  const embeddedV4 = ipv4FromMapped(lower);
  if (embeddedV4) return isPrivateIp(embeddedV4, 4);
  return false;
};

type ResolvedSafeUrl = {
  url: URL;
  // Pre-validated addresses we'll try in order. Pinning closes the
  // DNS-rebinding TOCTOU window: even if the hostname's records change
  // between our `lookup` and the actual TCP connect, the connect goes to
  // an IP we already proved is public. We keep the full validated set
  // (instead of pinning a single record) so a dual-stack hostname whose
  // first record is unreachable from this egress (e.g. an AAAA record in
  // an IPv4-only network) can still resolve via a later A record.
  pinnedAddresses: Array<{ address: string; family: 4 | 6 }>;
};

const assertSafeImageUrl = async (rawUrl: string): Promise<ResolvedSafeUrl> => {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ImageInputError("source_url is not a valid URL.");
  }
  if (url.protocol !== "https:") {
    throw new ImageInputError("source_url must use https://.");
  }
  // Disallow embedded auth — they have no business here and can mask hosts.
  if (url.username || url.password) {
    throw new ImageInputError("source_url must not embed credentials.");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const directIpFamily = isIP(hostname) as 0 | 4 | 6;
  if (directIpFamily) {
    if (isPrivateIp(hostname, directIpFamily)) {
      throw new ImageInputError(
        "source_url resolves to a private/internal address.",
      );
    }
    return {
      url,
      pinnedAddresses: [{ address: hostname, family: directIpFamily }],
    };
  }
  // Resolve every A/AAAA record so we can reject hostnames that mix public
  // and private answers. Any single private record fails the whole URL.
  let resolvedAll: Array<{ address: string; family: number }>;
  try {
    resolvedAll = await lookup(hostname, { all: true });
  } catch {
    throw new ImageInputError(
      `source_url hostname (${hostname}) could not be resolved.`,
    );
  }
  if (!resolvedAll || resolvedAll.length === 0) {
    throw new ImageInputError(
      `source_url hostname (${hostname}) returned no DNS records.`,
    );
  }
  for (const record of resolvedAll) {
    const family = record.family === 6 ? 6 : 4;
    if (isPrivateIp(record.address, family)) {
      throw new ImageInputError(
        "source_url resolves to a private/internal address.",
      );
    }
  }
  return {
    url,
    pinnedAddresses: resolvedAll.map((r) => ({
      address: r.address,
      family: r.family === 6 ? 6 : 4,
    })),
  };
};

type FetchedImage = {
  status: number;
  contentLength: number | null;
  body: Buffer;
};

// Bound the time a single source_url fetch can occupy a worker. The total
// budget covers DNS + connect + body read end-to-end; the idle timer fires
// when the socket goes silent for too long mid-transfer (slow-trickle
// attack). 10s is generous for a 500KB image even on slow public links.
const FETCH_TOTAL_TIMEOUT_MS = 10_000;
const FETCH_SOCKET_IDLE_TIMEOUT_MS = 5_000;

// Fetch over https using a custom DNS lookup that always returns the
// pre-validated IP. This guarantees the connection lands on the address we
// already proved is public. Streams the body, aborts past the cap, and
// rejects redirects by returning an error on any 30x status.
const httpsRequestPinned = ({
  url,
  pinnedAddress,
  pinnedFamily,
  cap,
}: {
  url: URL;
  pinnedAddress: string;
  pinnedFamily: 4 | 6;
  cap: number;
}): Promise<FetchedImage> => {
  const options: RequestOptions = {
    method: "GET",
    host: url.hostname,
    port: url.port ? Number(url.port) : 443,
    path: `${url.pathname}${url.search}`,
    headers: { Host: url.host, "User-Agent": "world-developer-portal-mcp" },
    lookup: (_hostname, lookupOptions, callback) => {
      // Ignore the hostname argument — we always return the pinned IP.
      // dns.lookup's callback contract differs by options.all:
      //   - options.all === true → (err, addresses[]) where each
      //     entry is { address, family }
      //   - otherwise            → (err, address, family)
      // Node's lookupAndConnectMultiple (used by the default
      // autoSelectFamily connect path on Node 18+) calls lookup with
      // { all: true } and treats a string address as an object,
      // triggering `Invalid IP address: undefined`. Honour both shapes.
      if (lookupOptions && (lookupOptions as { all?: boolean }).all === true) {
        (
          callback as (
            err: NodeJS.ErrnoException | null,
            addresses: Array<{ address: string; family: number }>,
          ) => void
        )(null, [{ address: pinnedAddress, family: pinnedFamily }]);
        return;
      }
      (
        callback as (
          err: NodeJS.ErrnoException | null,
          address: string,
          family: number,
        ) => void
      )(null, pinnedAddress, pinnedFamily);
    },
  };

  return new Promise<FetchedImage>((resolve, reject) => {
    let settled = false;
    let totalTimer: ReturnType<typeof setTimeout> | null = null;
    let responseReceived = false;

    const cleanup = () => {
      if (totalTimer) {
        clearTimeout(totalTimer);
        totalTimer = null;
      }
    };
    const succeed = (value: FetchedImage) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        req.destroy();
      } catch {
        // ignore — best-effort socket teardown.
      }
      reject(error);
    };

    const req = httpsRequest(options, (res) => {
      responseReceived = true;
      const status = res.statusCode ?? 0;
      // We never follow redirects: the new Location could resolve to a
      // private host. Surface the redirect so the caller resolves it
      // client-side first.
      if (status >= 300 && status < 400) {
        res.resume();
        fail(
          new ImageInputError(
            `source_url returned ${status} ${res.statusMessage ?? ""}; redirects are not followed.`,
          ),
        );
        return;
      }
      if (status < 200 || status >= 300) {
        res.resume();
        fail(
          new ImageInputError(
            `Failed to fetch source_url: ${status} ${res.statusMessage ?? ""}`,
          ),
        );
        return;
      }

      const declared = res.headers["content-length"];
      const contentLength =
        typeof declared === "string" ? Number.parseInt(declared, 10) : null;
      if (
        contentLength !== null &&
        Number.isFinite(contentLength) &&
        contentLength > cap
      ) {
        res.destroy();
        fail(
          new ImageInputError(
            `source_url Content-Length (${contentLength}) exceeds ${cap} bytes.`,
          ),
        );
        return;
      }

      const chunks: Buffer[] = [];
      let total = 0;
      res.on("data", (chunk: Buffer) => {
        total += chunk.byteLength;
        if (total > cap) {
          res.destroy();
          fail(
            new ImageInputError(
              `source_url body exceeds ${cap} bytes (read ${total}).`,
            ),
          );
          return;
        }
        chunks.push(chunk);
      });
      res.on("end", () => {
        succeed({
          status,
          contentLength,
          body: Buffer.concat(chunks, total),
        });
      });
      res.on("error", fail);
    });

    totalTimer = setTimeout(() => {
      fail(
        responseReceived
          ? new ImageInputError(
              `source_url fetch exceeded ${FETCH_TOTAL_TIMEOUT_MS}ms.`,
            )
          : new ConnectError(
              `source_url did not respond within ${FETCH_TOTAL_TIMEOUT_MS}ms.`,
            ),
      );
    }, FETCH_TOTAL_TIMEOUT_MS);

    req.setTimeout(FETCH_SOCKET_IDLE_TIMEOUT_MS, () => {
      fail(
        responseReceived
          ? new ImageInputError(
              `source_url socket was idle for ${FETCH_SOCKET_IDLE_TIMEOUT_MS}ms.`,
            )
          : new ConnectError(
              `source_url socket idle for ${FETCH_SOCKET_IDLE_TIMEOUT_MS}ms before any response.`,
            ),
      );
    });
    req.on("error", (err) => {
      fail(
        responseReceived
          ? new ImageInputError(`source_url socket error: ${err.message}`)
          : new ConnectError(
              `source_url could not connect to ${pinnedAddress}: ${err.message}`,
            ),
      );
    });
    req.end();
  });
};

export const fetchImageFromUrl = async (
  rawUrl: string,
): Promise<{ body: Buffer; contentType: "image/png" | "image/jpeg" }> => {
  const { url, pinnedAddresses } = await assertSafeImageUrl(rawUrl);
  // Try the validated A/AAAA records in order. Fall through to the next
  // entry on a transport-level failure (host unreachable, idle before
  // headers, etc. — surfaced by httpsRequestPinned as ConnectError); any
  // other failure means the host responded, so trying a sibling address
  // wouldn't change the outcome.
  const connectErrors: string[] = [];
  for (const pin of pinnedAddresses) {
    let result: FetchedImage;
    try {
      result = await httpsRequestPinned({
        url,
        pinnedAddress: pin.address,
        pinnedFamily: pin.family,
        cap: MAX_APP_IMAGE_BYTES,
      });
    } catch (error) {
      if (error instanceof ConnectError) {
        connectErrors.push(`${pin.address}: ${error.message}`);
        continue;
      }
      if (error instanceof ImageInputError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new ImageInputError(`Failed to fetch source_url: ${message}`);
    }
    const contentType = detectImageContentType(result.body);
    if (!contentType) {
      throw new ImageInputError(
        "source_url body is not a valid PNG or JPEG image.",
      );
    }
    return { body: result.body, contentType };
  }
  throw new ImageInputError(
    `Failed to fetch source_url after trying ${pinnedAddresses.length} validated address(es): ${connectErrors.join("; ")}`,
  );
};

export const decodeImageBase64 = (
  b64: string,
): { body: Buffer; contentType: "image/png" | "image/jpeg" } => {
  const body = Buffer.from(b64, "base64");
  if (body.length === 0) {
    throw new ImageInputError("image_base64 decoded to zero bytes.");
  }
  if (body.length > MAX_APP_IMAGE_BYTES) {
    throw new ImageInputError(
      `image_base64 decoded to ${body.length} bytes; maximum is ${MAX_APP_IMAGE_BYTES}.`,
    );
  }
  const contentType = detectImageContentType(body);
  if (!contentType) {
    throw new ImageInputError(
      "image_base64 bytes are not a valid PNG or JPEG image.",
    );
  }
  return { body, contentType };
};
