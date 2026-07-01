import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdSettingsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Settings/page";
import { ActionIdSettingsPage as ActionIdSettingsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Settings/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Settings" }),
};

type Props = { params: Promise<Record<string, string>> };

export default async function ActionIdSettingsRoutePage(props: Props) {
  return pickPortalVersion(
    () => <ActionIdSettingsPageV3 params={props.params} />,
    () => <ActionIdSettingsPage params={props.params} />,
  );
}
