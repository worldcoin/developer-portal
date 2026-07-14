import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { urls } from "@/lib/urls";
import { WorldIdActionIdSettingsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/page";
import { redirect } from "next/navigation";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    async () => {
      const params = await props.params;
      redirect(
        urls.worldIdAction({
          team_id: params.teamId,
          app_id: params.appId,
          action_id: params.actionId,
        }),
      );
    },
    () => <WorldIdActionIdSettingsPage params={props.params} />,
  );
}
