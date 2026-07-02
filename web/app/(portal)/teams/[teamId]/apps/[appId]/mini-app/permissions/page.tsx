import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AppPermissionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/MiniApp/Permissions/page";
import { AppPermissionsPage as AppPermissionsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Permissions/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Permissions" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    () => <AppPermissionsPageV3 params={props.params} />,
    () => <AppPermissionsPage params={props.params} />,
  );
}
