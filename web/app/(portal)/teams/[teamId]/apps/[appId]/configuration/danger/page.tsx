import { generateMetaTitle } from "@/lib/generate-title";
import { AppDangerZonePage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Danger/page";
import { Metadata } from "next";

type Props = { params: Promise<{ teamId: string; appId: string }> };

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default async function Page(props: Props) {
  const params = await props.params;
  return <AppDangerZonePage params={params} />;
}
