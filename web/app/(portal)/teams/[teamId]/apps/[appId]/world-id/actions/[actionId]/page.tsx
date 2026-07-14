import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { getIsUserAllowedToUpdateApp } from "@/lib/permissions";
import { appendSearchParams, urls } from "@/lib/urls";
import { WorldIdActionDetailPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/Actions/ActionId/page";
import { redirect } from "next/navigation";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  return pickPortalVersion(
    async () => (
      <WorldIdActionDetailPage
        params={params}
        canDelete={await getIsUserAllowedToUpdateApp(params.appId)}
      />
    ),
    () =>
      redirect(
        appendSearchParams(
          urls.worldIdAction({
            team_id: params.teamId,
            app_id: params.appId,
            action_id: params.actionId,
          }),
          searchParams,
        ),
      ),
  );
}
