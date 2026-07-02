import { generateMetaTitle } from "@/lib/genarate-title";
import { DevelopMiniApp } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/DevelopMiniApp";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "X" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return <DevelopMiniApp params={props.params} />;
}
