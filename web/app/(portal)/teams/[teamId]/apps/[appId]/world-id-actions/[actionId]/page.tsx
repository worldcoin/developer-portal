import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldIdActionIdPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page";
import { WorldIdActionIdPage as WorldIdActionIdPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    () => <WorldIdActionIdPageV3 params={props.params} />,
    () => <WorldIdActionIdPage params={props.params} />,
  );
}
