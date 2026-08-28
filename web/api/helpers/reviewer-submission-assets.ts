import "server-only";

import type { ReviewerAsset } from "@/scenes/Admin/reviewer/types";
import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const SAFE_APP_ID = /^[A-Za-z0-9_-]{1,200}$/;
const SAFE_LOCALE = /^[A-Za-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/;
const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,255}$/;
const SAFE_SNAPSHOT_ID = /^[a-f0-9]{32}$/;

type JsonRecord = Record<string, unknown>;

export type ReviewerAssetDescriptor = Omit<ReviewerAsset, "signedUrl"> & {
  key: string;
};

export type ReviewerSubmissionAssetSnapshot = {
  version: 1;
  prefix: string;
  objects: Record<string, string>;
};

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const appendAsset = (
  descriptors: ReviewerAssetDescriptor[],
  {
    appId,
    filename,
    kind,
    label,
    locale,
  }: {
    appId: string;
    filename: unknown;
    kind: ReviewerAsset["kind"];
    label: string;
    locale: string;
  },
) => {
  if (
    typeof filename !== "string" ||
    !SAFE_APP_ID.test(appId) ||
    !SAFE_LOCALE.test(locale) ||
    !SAFE_FILENAME.test(filename)
  ) {
    return;
  }

  const localePrefix = locale === "en" ? "" : `${locale}/`;
  const key = `unverified/${appId}/${localePrefix}${filename}`;
  descriptors.push({
    id: `${locale}:${kind}:${descriptors.length}`,
    key,
    kind,
    label,
    locale,
  });
};

const appendRecordAssets = (
  descriptors: ReviewerAssetDescriptor[],
  appId: string,
  locale: string,
  record: Record<string, unknown>,
  includeGlobalAssets: boolean,
) => {
  if (includeGlobalAssets) {
    appendAsset(descriptors, {
      appId,
      filename: record.logo_img_url,
      kind: "logo",
      label: "App logo",
      locale,
    });
    appendAsset(descriptors, {
      appId,
      filename: record.content_card_image_url,
      kind: "content_card",
      label: "Content card",
      locale,
    });
  }
  appendAsset(descriptors, {
    appId,
    filename: record.hero_image_url,
    kind: "hero",
    label: "Hero image",
    locale,
  });
  appendAsset(descriptors, {
    appId,
    filename: record.meta_tag_image_url,
    kind: "meta_tag",
    label: "Social image",
    locale,
  });
  strings(record.showcase_img_urls).forEach((filename, index) => {
    appendAsset(descriptors, {
      appId,
      filename,
      kind: "showcase",
      label: `Showcase ${index + 1}`,
      locale,
    });
  });
};

export const buildReviewerAssetDescriptors = ({
  appId,
  metadataSnapshot,
  localizationsSnapshot,
}: {
  appId: string;
  metadataSnapshot: Record<string, unknown>;
  localizationsSnapshot: Array<Record<string, unknown>>;
}): ReviewerAssetDescriptor[] => {
  const descriptors: ReviewerAssetDescriptor[] = [];
  appendRecordAssets(descriptors, appId, "en", metadataSnapshot, true);

  for (const localization of localizationsSnapshot) {
    if (typeof localization.locale !== "string") continue;
    appendRecordAssets(
      descriptors,
      appId,
      localization.locale,
      localization,
      false,
    );
  }

  const seen = new Set<string>();
  return descriptors.filter(({ key }) => {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const isSafeAssetSuffix = (suffix: string) => {
  const parts = suffix.split("/");
  if (parts.length === 1) return SAFE_FILENAME.test(parts[0]);
  return (
    parts.length === 2 &&
    SAFE_LOCALE.test(parts[0]) &&
    SAFE_FILENAME.test(parts[1])
  );
};

export const readReviewerSubmissionAssetSnapshot = ({
  appId,
  appMetadataId,
  value,
}: {
  appId: string;
  appMetadataId: string;
  value: unknown;
}): ReviewerSubmissionAssetSnapshot => {
  if (
    !SAFE_APP_ID.test(appId) ||
    !SAFE_APP_ID.test(appMetadataId) ||
    !isRecord(value) ||
    value.version !== 1 ||
    typeof value.prefix !== "string" ||
    !isRecord(value.objects)
  ) {
    throw new Error("Reviewer submission assets were not snapshotted.");
  }

  const prefixBase = `review-submissions/${appId}/${appMetadataId}/`;
  const snapshotId = value.prefix.startsWith(prefixBase)
    ? value.prefix.slice(prefixBase.length, -1)
    : "";
  if (
    !value.prefix.endsWith("/") ||
    !SAFE_SNAPSHOT_ID.test(snapshotId) ||
    value.prefix !== `${prefixBase}${snapshotId}/`
  ) {
    throw new Error("Invalid reviewer submission asset snapshot.");
  }

  const sourcePrefix = `unverified/${appId}/`;
  const objects: Record<string, string> = {};
  for (const [sourceKey, snapshotKey] of Object.entries(value.objects)) {
    const suffix = sourceKey.startsWith(sourcePrefix)
      ? sourceKey.slice(sourcePrefix.length)
      : "";
    if (
      typeof snapshotKey !== "string" ||
      !isSafeAssetSuffix(suffix) ||
      snapshotKey !== `${value.prefix}${suffix}`
    ) {
      throw new Error("Invalid reviewer submission asset snapshot.");
    }
    objects[sourceKey] = snapshotKey;
  }

  return { version: 1, prefix: value.prefix, objects };
};

export const resolveReviewerSubmissionAssetKey = ({
  appId,
  appMetadataId,
  assetSnapshot,
  sourceKey,
}: {
  appId: string;
  appMetadataId: string;
  assetSnapshot: unknown;
  sourceKey: string;
}) => {
  const snapshot = readReviewerSubmissionAssetSnapshot({
    appId,
    appMetadataId,
    value: assetSnapshot,
  });
  const snapshotKey = snapshot.objects[sourceKey];
  if (!snapshotKey) {
    throw new Error("Reviewer submission asset snapshot is incomplete.");
  }
  return snapshotKey;
};

type StoreOverride = {
  s3Client?: S3Client;
  bucketName?: string;
};

const resolveStore = ({ s3Client, bucketName }: StoreOverride) => {
  if (s3Client && bucketName) return { s3Client, bucketName };
  if (s3Client || bucketName) {
    throw new Error(
      "Reviewer submission asset storage override is incomplete.",
    );
  }
  const region = process.env.ASSETS_S3_REGION;
  const configuredBucket = process.env.ASSETS_S3_BUCKET_NAME;
  if (!region || !configuredBucket) {
    throw new Error("Reviewer submission asset storage is not configured.");
  }
  return {
    s3Client: new S3Client({ region }),
    bucketName: configuredBucket,
  };
};

export const deleteReviewerSubmissionAssetSnapshot = async ({
  assetSnapshot,
  appId,
  appMetadataId,
  ...storeOverride
}: {
  assetSnapshot: unknown;
  appId: string;
  appMetadataId: string;
} & StoreOverride) => {
  const snapshot = readReviewerSubmissionAssetSnapshot({
    appId,
    appMetadataId,
    value: assetSnapshot,
  });
  const keys = [...new Set(Object.values(snapshot.objects))];
  if (keys.length === 0) return;
  const { s3Client, bucketName } = resolveStore(storeOverride);
  await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }),
  );
};

export const tryDeleteReviewerSubmissionAssetSnapshot = async (
  input: {
    assetSnapshot: unknown;
    appId: string;
    appMetadataId: string;
  } & StoreOverride,
) => {
  try {
    await deleteReviewerSubmissionAssetSnapshot(input);
  } catch {
    // Preserve the submission/copy error. These operation-unique objects are
    // unreachable without a committed manifest and can be lifecycle-expired.
  }
};

export const snapshotReviewerSubmissionAssets = async ({
  appId,
  appMetadataId,
  metadataSnapshot,
  localizationsSnapshot,
  snapshotId = randomUUID().replaceAll("-", ""),
  ...storeOverride
}: {
  appId: string;
  appMetadataId: string;
  metadataSnapshot: Record<string, unknown>;
  localizationsSnapshot: Array<Record<string, unknown>>;
  snapshotId?: string;
} & StoreOverride): Promise<ReviewerSubmissionAssetSnapshot> => {
  if (
    !SAFE_APP_ID.test(appId) ||
    !SAFE_APP_ID.test(appMetadataId) ||
    !SAFE_SNAPSHOT_ID.test(snapshotId)
  ) {
    throw new Error("Invalid reviewer submission asset snapshot identity.");
  }

  const prefix = `review-submissions/${appId}/${appMetadataId}/${snapshotId}/`;
  const descriptors = buildReviewerAssetDescriptors({
    appId,
    metadataSnapshot,
    localizationsSnapshot,
  });
  const sourcePrefix = `unverified/${appId}/`;
  const objects = Object.fromEntries(
    descriptors.map(({ key }) => [
      key,
      `${prefix}${key.slice(sourcePrefix.length)}`,
    ]),
  );
  const assetSnapshot: ReviewerSubmissionAssetSnapshot = {
    version: 1,
    prefix,
    objects,
  };
  readReviewerSubmissionAssetSnapshot({
    appId,
    appMetadataId,
    value: assetSnapshot,
  });

  const { s3Client, bucketName } = resolveStore(storeOverride);
  const results = await Promise.allSettled(
    Object.entries(objects).map(async ([sourceKey, snapshotKey]) =>
      s3Client.send(
        new CopyObjectCommand({
          Bucket: bucketName,
          CopySource: `${bucketName}/${sourceKey}`,
          Key: snapshotKey,
        }),
      ),
    ),
  );
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failure) {
    await tryDeleteReviewerSubmissionAssetSnapshot({
      appId,
      appMetadataId,
      assetSnapshot,
      ...storeOverride,
    });
    throw failure.reason;
  }
  return assetSnapshot;
};
