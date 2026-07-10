import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout";
import { ReactNode } from "react";
import { AppLayoutRouteParams } from "../layout-params";

type Props = {
  params: AppLayoutRouteParams;
  children: ReactNode;
};

export default async function Layout(props: Props) {
  await props.params;

  return pickPortalVersion(
    () => <WorldIdLayout hasLegacyActions>{props.children}</WorldIdLayout>,
    () => <>{props.children}</>,
  );
}
