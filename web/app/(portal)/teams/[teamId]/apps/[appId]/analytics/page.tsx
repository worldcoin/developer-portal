import { resolveSelfieCheckAnalyticsEligibility } from "@/api/helpers/selfie-check-analytics/eligibility";
import { ErrorPage } from "@/components/ErrorPage";
import { generateMetaTitle } from "@/lib/genarate-title";
import { logger } from "@/lib/logger";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { AnalyticsAppEligibility } from "@/scenes/PortalV3/layout/Shell/SidebarNav";
import { MetricsFrame } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Analytics" }),
};

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
};

export default async function Page(props: Props) {
  const { appId } = await props.params;

  // Pages and layouts can render concurrently; authorize before reading data.
  if (!(await getIsUserAllowedToReadApp(appId))) {
    return (
      <>
        <AnalyticsAppEligibility appId={appId} enabled={false} />
        <ErrorPage statusCode={404} title="App not found" />
      </>
    );
  }

  try {
    const { entry, snapshot } =
      await resolveSelfieCheckAnalyticsEligibility(appId);
    return (
      <>
        <AnalyticsAppEligibility appId={appId} enabled={entry !== undefined} />
        {entry !== undefined ? (
          <MetricsFrame appId={appId} initialIsFallback={snapshot.isFallback} />
        ) : (
          <ErrorPage statusCode={404} title="Analytics not found" />
        )}
      </>
    );
  } catch (error) {
    logger.error("Failed to load analytics page eligibility", {
      appId,
      dependency: "s3",
      dataset: "selfie_check_totals",
      failureClass:
        error instanceof Error ? error.name : "UnknownSnapshotError",
      error,
    });
    return (
      <>
        <AnalyticsAppEligibility appId={appId} enabled={false} />
        <ErrorPage
          statusCode={503}
          title="Analytics are temporarily unavailable"
        />
      </>
    );
  }
}
