import { isWorldId40EnabledServer } from "@/lib/feature-flags/world-id-4-0/server";
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
    const { app } = await fetchAppEnvCached(resolvedParams.appId);

    if (!app?.[0] || app[0].rp_registration.length === 0) {
      redirect(
        `/teams/${resolvedParams.teamId}/apps/${resolvedParams.appId}?enableWorldId4=true`,
      );
    }
  }

  return <>{children}</>;
}
