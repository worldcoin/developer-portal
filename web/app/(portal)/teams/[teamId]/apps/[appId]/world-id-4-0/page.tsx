import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { urls } from "@/lib/urls";
import { WorldId40Page } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldId40/page";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
  searchParams: Promise<Record<string, string>>;
};

export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const worldIdPath = urls.worldId({
    team_id: params.teamId,
    app_id: params.appId,
    tab: "world-id-4-0",
  });

  return pickPortalVersion(
    () => {
      if (searchParams.createAction === "true") {
        return redirect(`${worldIdPath}&createAction=true`); // nosemgrep: javascript.express.open-redirect-deepsemgrep.open-redirect-deepsemgrep
      }
      return redirect(worldIdPath); // nosemgrep: javascript.express.open-redirect-deepsemgrep.open-redirect-deepsemgrep
    },
    () => <WorldId40Page params={params} />,
  );
}
