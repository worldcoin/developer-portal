import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
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

  return pickPortalVersion(
    () => <>{children}</>,
    async () => {
      const { app } = await fetchAppEnvCached(params.appId);
      if (!app?.[0] || app[0].rp_registration.length === 0) {
        redirect(
          `/teams/${params.teamId}/apps/${params.appId}?enableWorldId4=true`,
        );
      }
      return <>{children}</>;
    },
  );
}
