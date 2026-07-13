import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { appendSearchParams, urls } from "@/lib/urls";
import { WorldIdActionIdSettingsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/page";
import { redirect } from "next/navigation";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  return pickPortalVersion(
    // v3 settings fold into the /world-id/actions/[id] detail Settings card.
    () =>
      redirect(
        appendSearchParams(
          urls.worldIdActionDetail({
            team_id: params.teamId,
            app_id: params.appId,
            action_id: params.actionId,
          }),
          searchParams,
        ),
      ),
    () => <WorldIdActionIdSettingsPage params={props.params} />,
  );
}
