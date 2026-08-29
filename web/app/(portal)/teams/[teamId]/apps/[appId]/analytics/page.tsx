import { isAppInAnalytics } from "@/api/helpers/selfie-check-analytics/snapshots";
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
  // members outside the analytics rollout get an explicit Forbidden screen.
  if (!(await isAppInAnalytics(appId))) {
    return <ErrorPage statusCode={403} title="Forbidden" />;
  }

  return <MetricsFrame appId={appId} />;
}
