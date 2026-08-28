import { isSelfieCheckAnalyticsEnabledForApp } from "@/api/helpers/selfie-check-analytics/eligibility";
import { generateMetaTitle } from "@/lib/genarate-title";
import { MetricsFrame } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MetricsFrame";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Analytics" }),
};

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
};

export default async function Page(props: Props) {
  const { appId } = await props.params;

  if (!(await isSelfieCheckAnalyticsEnabledForApp(appId))) notFound();

  return <MetricsFrame appId={appId} />;
}
