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
  const { app } = await fetchAppEnvCached(params.appId);

  if (!app?.[0] || app[0].rp_registration.length === 0) {
    redirect(
      urls.configuration({
        team_id: params.teamId,
        app_id: params.appId,
      }),
    );
  }

  return <>{children}</>;
}
