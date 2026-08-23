import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdDangerPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Danger/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return <ActionIdDangerPage params={props.params} />;
}
