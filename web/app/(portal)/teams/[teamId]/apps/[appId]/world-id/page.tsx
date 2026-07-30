import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { getIsUserAllowedToUpdateApp } from "@/lib/permissions";
import { urls } from "@/lib/urls";
import { WorldIdPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "World ID" }),
};

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
  searchParams: Promise<Record<string, string>>;
};

export default async function Page(props: Props) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  return pickPortalVersion(
    async () => (
      <WorldIdPage
        params={params}
        searchParams={searchParams}
        canManageWorldId={await getIsUserAllowedToUpdateApp(params.appId)}
      />
    ),
    () => {
      const legacyPath = urls.worldId40({
        team_id: params.teamId,
        app_id: params.appId,
      });
      const query = new URLSearchParams(searchParams).toString();

      return redirect(query ? `${legacyPath}?${query}` : legacyPath);
    },
  );
}
