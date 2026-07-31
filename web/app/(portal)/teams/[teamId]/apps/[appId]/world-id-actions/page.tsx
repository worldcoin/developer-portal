import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { urls } from "@/lib/urls";
import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import { WorldIdActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/page";
import { redirect } from "next/navigation";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  return pickPortalVersion(
    () =>
      redirect(
        urls.worldIdTab({
          team_id: params.teamId,
          app_id: params.appId,
          tab: WORLD_ID_TABS.Actions,
          query: searchParams,
        }),
      ),
    () => <WorldIdActionsPage params={params} searchParams={searchParams} />,
  );
}
