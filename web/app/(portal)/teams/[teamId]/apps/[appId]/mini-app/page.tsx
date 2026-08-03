import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{
    teamId: string;
    appId: string;
  }>;
};

export default async function MiniAppPage(props: Props) {
  const params = await props.params;
  const ids = { team_id: params.teamId, app_id: params.appId };

  return pickPortalVersion(
    () => redirect(urls.miniAppDevelop(ids)),
    () => redirect(urls.miniAppPermissions(ids)),
  );
}
