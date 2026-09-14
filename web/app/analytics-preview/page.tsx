import {
  ANALYTICS_PREVIEW_APP_ID,
  analyticsPreviewData,
} from "@/lib/selfie-check-analytics-preview";
import { MetricsFrame } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame";

export const metadata = {
  title: "Selfie Check analytics preview",
};

/** Standalone, non-production-data preview of the Selfie Check analytics view. */
export default function AnalyticsPreviewPage() {
  return (
    <MetricsFrame
      appId={ANALYTICS_PREVIEW_APP_ID}
      previewData={analyticsPreviewData}
    />
  );
}
