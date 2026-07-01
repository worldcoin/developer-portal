import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AppIdPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/page";
import { AppIdPage as AppIdPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Dashboard" }),
};

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
};

export default async function DashboardRoutePage(props: Props) {
  return pickPortalVersion(
    () => <AppIdPageV3 params={props.params} />,
    () => <AppIdPage params={props.params} />,
  );
}
