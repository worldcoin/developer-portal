import {
  CopyObjectCommand,
  DeleteObjectsCommand,
  PutObjectTaggingCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import "server-only";

import {
  processContentCardImage,
  processLogoImage,
} from "@/api/helpers/image-processing";

const SAFE_ID = /^[A-Za-z0-9_-]+$/;
const SAFE_IMAGE_FILENAME = /^[A-Za-z0-9_-]+\.(?:png|jpe?g)$/i;
const SAFE_OPERATION_ID = /^[a-f0-9]{16,64}$/;
const MAX_ASSET_DELETE_BATCH = 1_000;

type JsonRecord = Record<string, unknown>;

export type PreparedMetadataAssets = {
  logoImgUrl: string;
  metaTagImageUrl: string;
  contentCardImageUrl: string;
  showcaseImgUrls: string[] | null;
};

export type PreparedLocalizationAssets = Record<
  string,
  {
    metaTagImageUrl?: string;
    showcaseImgUrls?: string[];
  }
>;

export type PreparedReviewerDecisionAssets = {
  metadataAssets: PreparedMetadataAssets;
  localizationAssets: PreparedLocalizationAssets;
  preparedKeys: string[];
};

export class ReviewerAssetDeleteError extends Error {
  readonly failedKeys: string[];

  constructor(failedKeys: string[]) {
    super("Some reviewer assets could not be deleted.");
    this.name = "ReviewerAssetDeleteError";
    this.failedKeys = failedKeys;
  }
}

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const requiredSafeId = (value: string, label: string) => {
  if (!SAFE_ID.test(value)) throw new Error(`Invalid ${label}.`);
  return value;
};

const optionalImageFilename = (
  value: unknown,
  label: string,
): string | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !SAFE_IMAGE_FILENAME.test(value)) {
    throw new Error(`Invalid ${label} asset filename.`);
  }
  return value;
};

const requiredImageFilename = (value: unknown, label: string) => {
  const filename = optionalImageFilename(value, label);
  if (!filename) throw new Error(`Missing ${label} asset filename.`);
  return filename;
};

const imageFilenameList = (value: unknown, label: string): string[] | null => {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value) || value.length > 3) {
    throw new Error(`Invalid ${label} asset list.`);
  }
  return value.map((entry, index) =>
    requiredImageFilename(entry, `${label} ${index + 1}`),
  );
};

const extension = (filename: string) => {
  const match = filename.match(/\.(png|jpe?g)$/i);
  if (!match) throw new Error("Invalid image asset extension.");
  return match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
};

const normalizedExtension = (filename: string) =>
  extension(filename) === "jpg" ? ".jpg" : ".png";

const configuredStore = () => {
  const region = process.env.ASSETS_S3_REGION;
  const bucketName = process.env.ASSETS_S3_BUCKET_NAME;
  if (!region || !bucketName) {
    throw new Error("Reviewer asset storage is not configured.");
  }
  return { s3Client: new S3Client({ region }), bucketName };
};

type StoreOverride = {
  s3Client?: S3Client;
  bucketName?: string;
};

const resolveStore = ({ s3Client, bucketName }: StoreOverride) => {
  if (s3Client && bucketName) return { s3Client, bucketName };
  if (s3Client || bucketName) {
    throw new Error("Reviewer asset storage override is incomplete.");
  }
  return configuredStore();
};

export const prepareReviewerDecisionAssets = async ({
  appId,
  appMetadataId,
  operationId,
  metadataSnapshot,
  localizationsSnapshot,
  registerPreparedPlan,
  ...storeOverride
}: {
  appId: string;
  appMetadataId: string;
  operationId: string;
  metadataSnapshot: unknown;
  localizationsSnapshot: unknown;
  registerPreparedPlan: (keys: string[]) => Promise<void>;
} & StoreOverride): Promise<PreparedReviewerDecisionAssets> => {
  requiredSafeId(appId, "app id");
  requiredSafeId(appMetadataId, "metadata id");
  if (!SAFE_OPERATION_ID.test(operationId)) {
    throw new Error("Invalid reviewer asset operation id.");
  }
  if (!isRecord(metadataSnapshot)) {
    throw new Error("Invalid metadata asset snapshot.");
  }
  if (!Array.isArray(localizationsSnapshot)) {
    throw new Error("Invalid localization asset snapshot.");
  }

  // Validate every source before starting any S3 write. A malformed later
  // localization must not leave an otherwise valid base asset half-prepared.
  const logo = requiredImageFilename(metadataSnapshot.logo_img_url, "logo");
  const metaTag = optionalImageFilename(
    metadataSnapshot.meta_tag_image_url,
    "meta tag",
  );
  const contentCard = optionalImageFilename(
    metadataSnapshot.content_card_image_url,
    "content card",
  );
  const showcases = imageFilenameList(
    metadataSnapshot.showcase_img_urls,
    "showcase",
  );
  const localizations = localizationsSnapshot.map((raw, index) => {
    if (!isRecord(raw)) {
      throw new Error(`Invalid localization asset snapshot ${index + 1}.`);
    }
    const id = requiredSafeId(String(raw.id ?? ""), "localization id");
    const locale = requiredSafeId(
      String(raw.locale ?? ""),
      "localization locale",
    );
    return {
      id,
      locale,
      metaTag: optionalImageFilename(
        raw.meta_tag_image_url,
        `localization ${locale} meta tag`,
      ),
      showcases: imageFilenameList(
        raw.showcase_img_urls,
        `localization ${locale} showcase`,
      ),
    };
  });

  const { s3Client, bucketName } = resolveStore(storeOverride);
  const sourcePrefix = `unverified/${appId}/`;
  const destinationPrefix = `verified/${appId}/`;
  const basename = `review_${appMetadataId}_${operationId}`;
  const preparedKeys: string[] = [];
  const writes: Array<() => Promise<unknown>> = [];

  const logoExt = extension(logo);
  const logoName = `${basename}_logo`;
  const logoFilename = `${logoName}.${logoExt}`;
  preparedKeys.push(
    `${destinationPrefix}${logoName}.${logoExt}`,
    `${destinationPrefix}${logoName}_original.${logoExt}`,
    `${destinationPrefix}${logoName}_rounded.png`,
  );
  writes.push(() =>
    processLogoImage(
      s3Client,
      bucketName,
      `${sourcePrefix}${logo}`,
      destinationPrefix,
      logoName,
      400,
      400,
      30,
      100,
      logoExt,
    ),
  );

  const copy = (sourceKey: string, destinationKey: string) => {
    preparedKeys.push(destinationKey);
    writes.push(
      async () =>
        await s3Client.send(
          new CopyObjectCommand({
            Bucket: bucketName,
            CopySource: `${bucketName}/${sourceKey}`,
            Key: destinationKey,
          }),
        ),
    );
  };

  let metaTagImageUrl = "";
  if (metaTag) {
    metaTagImageUrl = `${basename}_meta${normalizedExtension(metaTag)}`;
    copy(`${sourcePrefix}${metaTag}`, `${destinationPrefix}${metaTagImageUrl}`);
  }

  let contentCardImageUrl = "";
  if (contentCard) {
    contentCardImageUrl = `${basename}_content${normalizedExtension(contentCard)}`;
    const destinationKey = `${destinationPrefix}${contentCardImageUrl}`;
    preparedKeys.push(destinationKey);
    writes.push(() =>
      processContentCardImage(
        s3Client,
        bucketName,
        `${sourcePrefix}${contentCard}`,
        destinationKey,
        extension(contentCard),
      ),
    );
  }

  const showcaseImgUrls =
    showcases?.map((source, index) => {
      const filename = `${basename}_showcase_${index + 1}${normalizedExtension(source)}`;
      copy(`${sourcePrefix}${source}`, `${destinationPrefix}${filename}`);
      return filename;
    }) ?? null;

  const localizationAssets: PreparedLocalizationAssets = {};
  for (const localization of localizations) {
    const localizedPrefix = `${destinationPrefix}${localization.locale}/`;
    const localizedSourcePrefix = `${sourcePrefix}${localization.locale}/`;
    const localizedBasename = `${basename}_${localization.id}`;
    const update: PreparedLocalizationAssets[string] = {};

    if (localization.metaTag) {
      update.metaTagImageUrl = `${localizedBasename}_meta${normalizedExtension(
        localization.metaTag,
      )}`;
      copy(
        `${localizedSourcePrefix}${localization.metaTag}`,
        `${localizedPrefix}${update.metaTagImageUrl}`,
      );
    }
    if (localization.showcases) {
      update.showcaseImgUrls = localization.showcases.map((source, index) => {
        const filename = `${localizedBasename}_showcase_${index + 1}${normalizedExtension(source)}`;
        copy(
          `${localizedSourcePrefix}${source}`,
          `${localizedPrefix}${filename}`,
        );
        return filename;
      });
    }
    if (Object.keys(update).length > 0) {
      localizationAssets[localization.id] = update;
    }
  }

  const uniquePreparedKeys = [...new Set(preparedKeys)];
  await registerPreparedPlan(uniquePreparedKeys);

  const results = await Promise.allSettled(
    writes.map(async (write) => await write()),
  );
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failure) {
    try {
      await deletePreparedReviewerAssets({
        keys: preparedKeys,
        s3Client,
        bucketName,
      });
    } catch {
      // Preserve the preparation error. The operation-unique key plan was
      // registered durably before S3 writes and the worker will retry cleanup.
    }
    throw failure.reason;
  }

  return {
    metadataAssets: {
      logoImgUrl: logoFilename,
      metaTagImageUrl,
      contentCardImageUrl,
      showcaseImgUrls,
    },
    localizationAssets,
    preparedKeys: uniquePreparedKeys,
  };
};

export const deletePreparedReviewerAssets = async ({
  keys,
  abortSignal,
  ...storeOverride
}: {
  keys: string[];
  abortSignal?: AbortSignal;
} & StoreOverride): Promise<void> => {
  const { s3Client, bucketName } = resolveStore(storeOverride);
  const uniqueKeys = [...new Set(keys)];
  const failedKeys: string[] = [];
  for (
    let index = 0;
    index < uniqueKeys.length;
    index += MAX_ASSET_DELETE_BATCH
  ) {
    const batch = uniqueKeys.slice(index, index + MAX_ASSET_DELETE_BATCH);
    if (batch.length === 0) continue;
    try {
      const command = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      });
      const response = abortSignal
        ? await s3Client.send(command, { abortSignal })
        : await s3Client.send(command);
      if (response.Errors?.length) {
        const reportedKeys = response.Errors.flatMap(({ Key }) =>
          Key && batch.includes(Key) ? [Key] : [],
        );
        failedKeys.push(
          ...(reportedKeys.length === response.Errors.length
            ? reportedKeys
            : batch),
        );
      }
    } catch {
      failedKeys.push(...batch);
    }
  }
  if (failedKeys.length > 0) {
    throw new ReviewerAssetDeleteError([...new Set(failedKeys)]);
  }
};

const safePublishedFilename = (value: unknown): string | null =>
  typeof value === "string" && SAFE_IMAGE_FILENAME.test(value) ? value : null;

export const collectVerifiedReviewerAssetKeys = ({
  appId,
  metadata,
}: {
  appId: string;
  metadata: unknown;
}): string[] => {
  requiredSafeId(appId, "app id");
  if (!isRecord(metadata)) return [];
  const keys = new Set<string>();
  const basePrefix = `verified/${appId}/`;
  const add = (prefix: string, value: unknown, logo = false) => {
    const filename = safePublishedFilename(value);
    if (!filename) return;
    keys.add(`${prefix}${filename}`);
    if (logo) {
      const suffixIndex = filename.lastIndexOf(".");
      const basename = filename.slice(0, suffixIndex);
      const ext = filename.slice(suffixIndex);
      keys.add(`${prefix}${basename}_original${ext}`);
      keys.add(`${prefix}${basename}_rounded.png`);
    }
  };

  add(basePrefix, metadata.logo_img_url, true);
  add(basePrefix, metadata.hero_image_url);
  add(basePrefix, metadata.meta_tag_image_url);
  add(basePrefix, metadata.content_card_image_url);
  if (Array.isArray(metadata.showcase_img_urls)) {
    for (const value of metadata.showcase_img_urls) add(basePrefix, value);
  }
  if (Array.isArray(metadata.localisations)) {
    for (const raw of metadata.localisations) {
      if (!isRecord(raw) || typeof raw.locale !== "string") continue;
      if (!SAFE_ID.test(raw.locale)) continue;
      const prefix = `${basePrefix}${raw.locale}/`;
      add(prefix, raw.hero_image_url);
      add(prefix, raw.meta_tag_image_url);
      if (Array.isArray(raw.showcase_img_urls)) {
        for (const value of raw.showcase_img_urls) add(prefix, value);
      }
    }
  }
  return [...keys];
};

export const expireVerifiedReviewerAssets = async ({
  keys,
  abortSignal,
  ...storeOverride
}: { keys: string[]; abortSignal?: AbortSignal } & StoreOverride): Promise<
  string[]
> => {
  const { s3Client, bucketName } = resolveStore(storeOverride);
  const uniqueKeys = [...new Set(keys)];
  const results = await Promise.allSettled(
    uniqueKeys.map((Key) => {
      const command = new PutObjectTaggingCommand({
        Bucket: bucketName,
        Key,
        Tagging: { TagSet: [{ Key: "expired", Value: "true" }] },
      });
      return abortSignal
        ? s3Client.send(command, { abortSignal })
        : s3Client.send(command);
    }),
  );
  return uniqueKeys.filter((_, index) => results[index].status === "rejected");
};
