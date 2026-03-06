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

export default async function Layout({ params, children }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const showWorldId40Nav = await isWorldId40EnabledServer(
    resolvedParams.teamId,
  );

  if (showWorldId40Nav) {
    const { action } = await fetchAppEnvCached(resolvedParams.appId);

    if (action.length === 0) {
      redirect(
        urls.worldIdActions({
          team_id: resolvedParams.teamId,
          app_id: resolvedParams.appId,
        }),
      );
    }
  }

  return <>{children}</>;
}
