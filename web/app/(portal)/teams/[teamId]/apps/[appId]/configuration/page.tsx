import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfilePage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/page";
import { Metadata } from "next";

type Props = {
  params:
    | {
        teamId: string;
        appId: string;
      }
    | Promise<{
        teamId: string;
        appId: string;
      }>;
};

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Overview" }),
};

export default async function Page({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  return <AppProfilePage params={resolvedParams} />;
}
