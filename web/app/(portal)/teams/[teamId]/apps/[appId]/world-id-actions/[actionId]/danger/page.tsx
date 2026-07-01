import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldIdActionIdDangerPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Danger/page";
import { WorldIdActionIdDangerPage as WorldIdActionIdDangerPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Danger/page";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    () => <WorldIdActionIdDangerPageV3 params={props.params} />,
    () => <WorldIdActionIdDangerPage params={props.params} />,
  );
}
