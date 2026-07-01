import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdKioskPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk";
import { ActionIdKioskPage as ActionIdKioskPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Kiosk" }),
};

type Props = { params: Promise<Record<string, string>> };

export default async function ActionIdKioskRoutePage(props: Props) {
  return pickPortalVersion(
    () => <ActionIdKioskPageV3 params={props.params} />,
    () => <ActionIdKioskPage params={props.params} />,
  );
}
