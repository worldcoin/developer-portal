import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdDangerPage as ActionIdDangerPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Danger/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return <ActionIdDangerPageV3 params={props.params} />;
}
