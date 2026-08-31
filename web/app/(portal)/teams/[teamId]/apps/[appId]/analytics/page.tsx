import { checkEligibility } from "@/api/helpers/selfie-check-analytics/eligibility";
import { ErrorPage } from "@/components/ErrorPage";
import { generateMetaTitle } from "@/lib/genarate-title";
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
  // apps without a totals row are the same 404 so the tab cannot leak.
  if (!(await checkEligibility(appId))) {
    return <ErrorPage statusCode={404} title="Not found" />;
  }

  return <MetricsFrame appId={appId} />;
}
