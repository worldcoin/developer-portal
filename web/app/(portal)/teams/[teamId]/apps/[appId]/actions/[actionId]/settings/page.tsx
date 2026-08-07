import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdSettingsPage as ActionIdSettingsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Settings/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Settings" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return <ActionIdSettingsPageV3 params={props.params} />;
}
