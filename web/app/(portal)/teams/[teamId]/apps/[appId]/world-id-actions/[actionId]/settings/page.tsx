import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldIdActionIdSettingsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Settings/page";
import { redirect } from "next/navigation";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    // Settings now live on the consolidated action-detail page. From this
    // subroute, "./" resolves to the parent action route.
    () => redirect("./"),
    () => <WorldIdActionIdSettingsPage params={props.params} />,
  );
}
