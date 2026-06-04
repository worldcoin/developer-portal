import { isWorldId40EnabledServer } from "@/lib/feature-flags/world-id-4-0/server";
import { urls } from "@/lib/urls";
import { fetchAppEnvCached } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";
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
  const showWorldId40Nav = await isWorldId40EnabledServer(params.teamId);

  if (showWorldId40Nav) {
    const { action } = await fetchAppEnvCached(params.appId);

    if (action.length === 0) {
      redirect(
        urls.worldIdActions({
          team_id: params.teamId,
          app_id: params.appId,
        }),
      );
    }
  }

  return <>{children}</>;
}
