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

  // World ID 4.0 is available by default (no rollout flag). Apps without an RP
  // registration are sent into the enable flow via ?enableWorldId4=true, which
  // the dashboard banner auto-opens.
  const { app } = await fetchAppEnvCached(params.appId);
  if (!app?.[0] || app[0].rp_registration.length === 0) {
    redirect(
      `/teams/${params.teamId}/apps/${params.appId}?enableWorldId4=true`,
    );
  }

  return <>{children}</>;
}
