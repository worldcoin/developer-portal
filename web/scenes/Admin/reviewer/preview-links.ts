import type { ReviewerAppMode } from "./types";

export const buildMiniAppDraftUrl = (appId: string, metadataId: string) =>
  `https://world.org/mini-app?app_id=${encodeURIComponent(appId)}&path=&draft_id=${encodeURIComponent(metadataId)}`;

export const getSafeExternalIntegrationUrl = (
  integrationUrl: unknown,
): string | null => {
  if (typeof integrationUrl !== "string") return null;

  try {
    const parsed = new URL(integrationUrl);
    return parsed.protocol === "https:" &&
      parsed.hostname &&
      !parsed.username &&
      !parsed.password
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
};

export const getReviewerTestUrl = ({
  appId,
  metadataId,
  mode,
  integrationUrl,
}: {
  appId: string;
  metadataId: string;
  mode: ReviewerAppMode;
  integrationUrl: unknown;
}) =>
  mode === "mini-app"
    ? buildMiniAppDraftUrl(appId, metadataId)
    : getSafeExternalIntegrationUrl(integrationUrl);
