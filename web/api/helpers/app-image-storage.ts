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

const assertSafeImageUrl = async (rawUrl: string): Promise<URL> => {
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
  // Resolve hostname → reject private / loopback / link-local / multicast.
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const directIpFamily = isIP(hostname) as 0 | 4 | 6;
  if (directIpFamily) {
    if (isPrivateIp(hostname, directIpFamily)) {
      throw new ImageInputError(
        "source_url resolves to a private/internal address.",
      );
    }
    return url;
  }
  // Validate every A/AAAA record. fetch performs its own resolution and may
  // pick a different record than we did, so any single private address in
  // the result set is grounds for refusal — not just the first one we see.
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
  return url;
};

const readWithCap = async (
  body: ReadableStream<Uint8Array>,
  cap: number,
): Promise<Buffer> => {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > cap) {
        await reader.cancel().catch(() => {});
        throw new ImageInputError(
          `source_url body exceeds ${cap} bytes (read ${total}).`,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(
    chunks.map((c) => Buffer.from(c)),
    total,
  );
};

export const fetchImageFromUrl = async (
  rawUrl: string,
): Promise<{ body: Buffer; contentType: "image/png" | "image/jpeg" }> => {
  const url = await assertSafeImageUrl(rawUrl);
  let response;
  try {
    response = await fetch(url, { redirect: "error" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ImageInputError(`Failed to fetch source_url: ${message}`);
  }
  if (!response.ok) {
    throw new ImageInputError(
      `Failed to fetch source_url: ${response.status} ${response.statusText}`,
    );
  }
  // Bail early if the server tells us the body is too big up front.
  const declared = response.headers.get("content-length");
  if (declared) {
    const declaredBytes = Number.parseInt(declared, 10);
    if (Number.isFinite(declaredBytes) && declaredBytes > MAX_APP_IMAGE_BYTES) {
      throw new ImageInputError(
        `source_url Content-Length (${declaredBytes}) exceeds ${MAX_APP_IMAGE_BYTES} bytes.`,
      );
    }
  }
  if (!response.body) {
    throw new ImageInputError("source_url response had no body.");
  }
  const body = await readWithCap(response.body, MAX_APP_IMAGE_BYTES);
  const contentType = detectImageContentType(body);
  if (!contentType) {
    throw new ImageInputError(
      "source_url body is not a valid PNG or JPEG image.",
    );
  }
  return { body, contentType };
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
