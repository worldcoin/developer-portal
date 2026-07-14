import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldIdActionIdSettingsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/page";
import { redirect } from "next/navigation";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    () => redirect("./"),
    () => <WorldIdActionIdSettingsPage params={props.params} />,
  );
}
