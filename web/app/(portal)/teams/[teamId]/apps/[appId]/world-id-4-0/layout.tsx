import { urls } from "@/lib/urls";
import { fetchAppEnvCached } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { AppLayoutRouteParams } from "../layout-params";

type Props = {
  params: AppLayoutRouteParams;
  children: ReactNode;
};

export default async function Layout({ params, children }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const { app } = await fetchAppEnvCached(resolvedParams.appId);

  if (!app?.[0] || app[0].rp_registration.length === 0) {
    redirect(
      urls.configuration({
        team_id: resolvedParams.teamId,
        app_id: resolvedParams.appId,
      }),
    );
  }

  return <>{children}</>;
}
