import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfileDangerPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/Danger/page";
import { AppDangerZonePage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Danger/page";
import { Metadata } from "next";

type Props = { params: Promise<{ teamId: string; appId: string }> };

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default async function Page(props: Props) {
  const params = await props.params;
  return pickPortalVersion(
    () => <AppDangerZonePage params={params} />,
    () => <AppProfileDangerPage params={params} />,
  );
}
