import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldIdActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/page";
import { WorldIdActionsPage as WorldIdActionsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/page";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  return pickPortalVersion(
    () => <WorldIdActionsPageV3 params={params} searchParams={searchParams} />,
    () => <WorldIdActionsPage params={params} searchParams={searchParams} />,
  );
}
