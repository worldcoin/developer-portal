import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdDangerPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Danger/page";
import { ActionIdDangerPage as ActionIdDangerPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Danger/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    () => <ActionIdDangerPageV3 params={props.params} />,
    () => <ActionIdDangerPage params={props.params} />,
  );
}
