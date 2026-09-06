import { generateMetaTitle } from "@/lib/generate-title";
import { ActionIdPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Overview" }),
};

export default function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return <ActionIdPage params={props.params} />;
}
