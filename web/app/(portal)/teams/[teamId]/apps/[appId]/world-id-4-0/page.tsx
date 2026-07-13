import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { appendSearchParams, urls } from "@/lib/urls";
import { WorldId40Page } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldId40/page";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
  searchParams: Promise<Record<string, string>>;
};

export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  return pickPortalVersion(
    () =>
      redirect(
        // The explicit tab wins over any incoming ?tab — appendSearchParams
        // gives params already in the path precedence.
        appendSearchParams(
          urls.worldId({
            team_id: params.teamId,
            app_id: params.appId,
            tab: "world-id-4-0",
          }),
          searchParams,
        ),
      ),
    () => <WorldId40Page params={params} />,
  );
}
