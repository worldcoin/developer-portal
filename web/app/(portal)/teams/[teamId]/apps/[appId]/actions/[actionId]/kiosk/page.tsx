import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdKioskPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Kiosk" }),
};

export default function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return <ActionIdKioskPage params={props.params} />;
}
