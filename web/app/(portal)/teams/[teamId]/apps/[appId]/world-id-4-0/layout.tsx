import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { SectionLoading } from "@/scenes/PortalV3/common/SectionLoading";
import { fetchAppEnvCached } from "@/scenes/common/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";
import { redirect } from "next/navigation";
import { ReactNode, Suspense } from "react";
import { AppLayoutRouteParams } from "../layout-params";

type Props = {
  params: AppLayoutRouteParams;
  children: ReactNode;
};

export default async function Layout(props: Props) {
  const params = await props.params;
  const { children } = props;

  return pickPortalVersion(
    // v3 has no section chrome here, so the loading boundary lives on the
    // shim's v3 arm: entering World ID commits the navigation below the
    // persistent shell while the page streams in. v2 behavior is unchanged.
    () => <Suspense fallback={<SectionLoading />}>{children}</Suspense>,
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
