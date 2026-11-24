import { getIsUserAllowedToUpdateApp } from "@/lib/permissions";
import { WorldIdActionDetailPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  const params = await props.params;

  return (
    <WorldIdActionDetailPage
      params={params}
      canModify={await getIsUserAllowedToUpdateApp(params.appId)}
    />
  );
}
