import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfileDangerPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/Danger/page";
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
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default async function Page({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  return <AppProfileDangerPage params={resolvedParams} />;
}
