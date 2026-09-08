import { getIsUserAllowedToUpdateApp } from "@/lib/permissions";
import { WorldIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout";
import { ReactNode } from "react";
import { AppLayoutRouteParams } from "../layout-params";

type Props = {
  params: AppLayoutRouteParams;
  children: ReactNode;
};

export default async function Layout(props: Props) {
  const params = await props.params;

  return (
    <WorldIdLayout
      teamId={params.teamId}
      appId={params.appId}
      canManageWorldId={await getIsUserAllowedToUpdateApp(params.appId)}
    >
      {props.children}
    </WorldIdLayout>
  );
}
