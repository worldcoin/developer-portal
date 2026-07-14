import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { getIsUserAllowedToUpdateApp } from "@/lib/permissions";
import { WorldIdActionIdSettingsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/page";
import { WorldIdActionDetailPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/Actions/ActionId/page";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    async () => {
      const params = await props.params;

      return (
        <WorldIdActionDetailPage
          params={params}
          canDelete={await getIsUserAllowedToUpdateApp(params.appId)}
        />
      );
    },
    () => <WorldIdActionIdSettingsPage params={props.params} />,
  );
}
