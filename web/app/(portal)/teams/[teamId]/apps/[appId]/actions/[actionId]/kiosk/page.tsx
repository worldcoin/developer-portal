import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdKioskPage as ActionIdKioskPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Kiosk" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return <ActionIdKioskPageV3 params={props.params} />;
}
