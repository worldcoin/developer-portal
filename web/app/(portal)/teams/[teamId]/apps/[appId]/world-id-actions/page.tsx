import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { appendSearchParams, urls } from "@/lib/urls";
import { WorldIdActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/page";
import { redirect } from "next/navigation";

export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  // Preserve deep-link params through the v3 redirect (?createAction=true is
  // honored by the /world-id landing).
  const target = appendSearchParams(
    urls.worldId({ team_id: params.teamId, app_id: params.appId }),
    searchParams,
  );

  return pickPortalVersion(
    () => redirect(target),
    () => <WorldIdActionsPage params={params} searchParams={searchParams} />,
  );
}
