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

  // Match world-id-actions: apps without an RP registration are sent to the
  // dashboard enable flow (?enableWorldId4=true), which auto-opens the dialog.
  if (!app?.[0] || app[0].rp_registration.length === 0) {
    redirect(
      `/teams/${params.teamId}/apps/${params.appId}?enableWorldId4=true`,
    );
  }

  return <>{children}</>;
}
