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

  // World ID 4.0 is available by default (no rollout flag). An app with no
  // legacy v3 actions has nothing to show here, so route it to the v4 surface.
  const { action } = await fetchAppEnvCached(params.appId);
  if (action.length === 0) {
    redirect(
      urls.worldIdActions({
        team_id: params.teamId,
        app_id: params.appId,
      }),
    );
  }

  return <>{children}</>;
}
