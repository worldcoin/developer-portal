import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/page";
import { ActionIdPage as ActionIdPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Overview" }),
};

type Props = { params: Promise<Record<string, string>> };

export default async function ActionIdRoutePage(props: Props) {
  return pickPortalVersion(
    () => <ActionIdPageV3 params={props.params} />,
    () => <ActionIdPage params={props.params} />,
  );
}
