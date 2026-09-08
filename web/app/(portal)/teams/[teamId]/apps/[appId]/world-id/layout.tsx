import {
  getIsUserAllowedToSwitchRpMode,
  getIsUserAllowedToUpdateApp,
} from "@/lib/permissions";
import { WorldIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout";
import { ReactNode } from "react";
import { AppLayoutRouteParams } from "../layout-params";

type Props = {
  params: AppLayoutRouteParams;
  children: ReactNode;
};

export default async function Layout(props: Props) {
  const params = await props.params;
  const [canManageWorldId, canSwitchToSelfManaged] = await Promise.all([
    getIsUserAllowedToUpdateApp(params.appId),
    getIsUserAllowedToSwitchRpMode(params.appId),
  ]);

  return (
    <WorldIdLayout
      teamId={params.teamId}
      appId={params.appId}
      canManageWorldId={canManageWorldId}
      canSwitchToSelfManaged={canSwitchToSelfManaged}
    >
      {props.children}
    </WorldIdLayout>
  );
}
