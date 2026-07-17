import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldIdActionIdDangerPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/Danger/page";
import { redirect } from "next/navigation";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    // Danger controls now live on the consolidated action-detail page. From
    // this subroute, "./" resolves to the parent action route.
    () => redirect("./"),
    () => <WorldIdActionIdDangerPage params={props.params} />,
  );
}
