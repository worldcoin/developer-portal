import { generateMetaTitle } from "@/lib/genarate-title";
import { DevelopPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Develop/page";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
};

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Develop" }),
};

export default async function Page(props: Props) {
  const params = await props.params;

  return <DevelopPage params={Promise.resolve(params)} />;
}
