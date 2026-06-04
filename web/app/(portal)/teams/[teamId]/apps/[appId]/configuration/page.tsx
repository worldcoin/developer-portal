import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfilePage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/page";
import { Metadata } from "next";

type Props = {
  params: Promise<{
    teamId: string;
    appId: string;
  }>;
};

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Overview" }),
};

export default async function Page(props: Props) {
  const params = await props.params;
  return <AppProfilePage params={params} />;
}
