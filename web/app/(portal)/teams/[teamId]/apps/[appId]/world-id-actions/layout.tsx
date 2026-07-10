import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { urls } from "@/lib/urls";
import { WorldIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout";
import { fetchAppEnvCached } from "@/scenes/common/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { AppLayoutRouteParams } from "../layout-params";

type Props = {
  params: AppLayoutRouteParams;
  children: ReactNode;
};

export default async function Layout(props: Props) {
  const params = await props.params;
  const { children } = props;
  const { app, action } = await fetchAppEnvCached(params.appId);

  if (!app?.[0]?.rp_registration?.length) {
    redirect(
      urls.enableWorldId4({ team_id: params.teamId, app_id: params.appId }),
    );
  }

  return pickPortalVersion(
    () => (
      <WorldIdLayout hasLegacyActions={action.length > 0}>
        {children}
      </WorldIdLayout>
    ),
    () => <>{children}</>,
  );
}
