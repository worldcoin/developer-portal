import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldIdActionIdSettingsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/page";
import { WorldIdActionIdSettingsPage as WorldIdActionIdSettingsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/page";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    () => <WorldIdActionIdSettingsPageV3 params={props.params} />,
    () => <WorldIdActionIdSettingsPage params={props.params} />,
  );
}
