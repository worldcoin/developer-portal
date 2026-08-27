import "server-only";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { ReviewerAsset } from "../types";

const SAFE_APP_ID = /^[A-Za-z0-9_-]{1,200}$/;
const SAFE_LOCALE = /^[A-Za-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/;
const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,255}$/;
const SIGNED_URL_TTL_SECONDS = 15 * 60;

type AssetDescriptor = Omit<ReviewerAsset, "signedUrl"> & { key: string };

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

const appendAsset = (
  descriptors: AssetDescriptor[],
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
  descriptors: AssetDescriptor[],
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
}): AssetDescriptor[] => {
  const descriptors: AssetDescriptor[] = [];
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

export const signReviewerSubmissionAssets = async (input: {
  appId: string;
  metadataSnapshot: Record<string, unknown>;
  localizationsSnapshot: Array<Record<string, unknown>>;
}): Promise<ReviewerAsset[]> => {
  const region = process.env.ASSETS_S3_REGION;
  const bucket = process.env.ASSETS_S3_BUCKET_NAME;
  if (!region || !bucket)
    throw new Error("Reviewer asset signing is not configured");

  const client = new S3Client({ region });
  const descriptors = buildReviewerAssetDescriptors(input);
  return Promise.all(
    descriptors.map(async ({ key, ...descriptor }) => ({
      ...descriptor,
      signedUrl: await getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: SIGNED_URL_TTL_SECONDS },
      ),
    })),
  );
};
