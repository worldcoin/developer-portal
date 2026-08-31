import { isSelfieCheckAnalyticsEnabledForApp } from "@/api/helpers/selfie-check-analytics/eligibility";
import { ErrorPage } from "@/components/ErrorPage";
import { generateMetaTitle } from "@/lib/genarate-title";
import { MetricsFrame } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Analytics" }),
};

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
  searchParams?: Promise<AnalyticsSearchParams>;
};

type AnalyticsSearchParams = { mock?: string | string[] };

export default async function Page(props: Props) {
  const [{ appId }, searchParams]: [
    { teamId: string; appId: string },
    AnalyticsSearchParams,
  ] = await Promise.all([
    props.params,
    props.searchParams ?? Promise.resolve({}),
  ]);
  // Local visual preview only. Production always enforces the rollout gate;
  // the parent app layout still enforces membership in development.
  const useMock =
    process.env.NODE_ENV === "development" && searchParams.mock === "1";

  // The parent app layout already renders non-members as "App not found";
  // members outside the analytics rollout get an explicit Forbidden screen.
  if (!useMock && !(await isSelfieCheckAnalyticsEnabledForApp(appId))) {
    return <ErrorPage statusCode={403} title="Forbidden" />;
  }

  return <MetricsFrame appId={appId} mock={useMock} />;
}
