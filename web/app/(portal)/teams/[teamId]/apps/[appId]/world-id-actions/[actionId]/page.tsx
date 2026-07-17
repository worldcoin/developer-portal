import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { getIsUserAllowedToUpdateApp } from "@/lib/permissions";
import { WorldIdActionIdPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page";
import { WorldIdActionDetailPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    async () => {
      const params = await props.params;

      return (
        <WorldIdActionDetailPage
          params={params}
          canModify={await getIsUserAllowedToUpdateApp(params.appId)}
        />
      );
    },
    () => <WorldIdActionIdPage params={props.params} />,
  );
}
