import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { urls } from "@/lib/urls";
import { WorldIdActionDetailPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/Actions/ActionId/page";
import { redirect } from "next/navigation";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  const params = await props.params;
  return pickPortalVersion(
    () => <WorldIdActionDetailPage params={params} />,
    () =>
      redirect(
        urls.worldIdAction({
          team_id: params.teamId,
          app_id: params.appId,
          action_id: params.actionId,
        }),
      ),
  );
}
