import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import { ActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Incognito actions" }),
};

export default async function Page(props: {
  params: Promise<{ teamId: string; appId: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    async () => {
      const [params, searchParams] = await Promise.all([
        props.params,
        props.searchParams,
      ]);
      return redirect(
        urls.worldIdTab({
          team_id: params.teamId,
          app_id: params.appId,
          tab: WORLD_ID_TABS.LegacyActions,
          query: searchParams,
        }),
      );
    },
    () => (
      <ActionsPage params={props.params} searchParams={props.searchParams} />
    ),
  );
}
