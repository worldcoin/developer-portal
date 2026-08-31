import { checkEligibility } from "@/api/helpers/selfie-check-analytics/eligibility";
import { ErrorPage } from "@/components/ErrorPage";
import { generateMetaTitle } from "@/lib/genarate-title";
import { logger } from "@/lib/logger";
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

  // The parent app layout already renders non-members as "App not found";
  // apps without totals data get an explicit Forbidden screen.
  let isEligible: boolean;
  try {
    isEligible = await checkEligibility(appId);
  } catch (error) {
    logger.error("Failed to resolve selfie-check analytics page eligibility", {
      dependency: "redis",
      appId,
      failureClass: error instanceof Error ? error.name : "UnknownRedisError",
      error,
    });
    return <ErrorPage statusCode={503} title="Analytics unavailable" />;
  }

  if (!isEligible) {
    return <ErrorPage statusCode={404} title="Not found" />;
  }

  return <MetricsFrame appId={appId} />;
}
