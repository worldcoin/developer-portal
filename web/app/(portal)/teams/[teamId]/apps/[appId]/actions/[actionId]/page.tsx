import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdPage as ActionIdPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Overview" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return <ActionIdPageV3 params={props.params} />;
}
