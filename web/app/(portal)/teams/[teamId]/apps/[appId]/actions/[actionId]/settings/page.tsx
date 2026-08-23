import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdSettingsPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Settings/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Settings" }),
};

export default function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return <ActionIdSettingsPage params={props.params} />;
}
