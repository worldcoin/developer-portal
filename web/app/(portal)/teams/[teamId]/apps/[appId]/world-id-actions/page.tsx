import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldIdActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/page";
import { WorldIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout";
import { WorldIdActionsPage as WorldIdActionsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/page";
import { fetchAppEnvCached } from "@/scenes/common/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  return pickPortalVersion(
    async () => {
      const { action } = await fetchAppEnvCached(params.appId);

      return (
        <WorldIdLayout hasLegacyActions={action.length > 0}>
          <WorldIdActionsPageV3 params={params} searchParams={searchParams} />
        </WorldIdLayout>
      );
    },
    () => <WorldIdActionsPage params={params} searchParams={searchParams} />,
  );
}
