import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import { WorldId40Page } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldId40/page";
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

  // Portal V3 uses `/world-id` as its canonical route. Portal V2 still owns
  // this route, so only the V3 branch redirects and V2 keeps its existing guard.
  return pickPortalVersion(
    () => {
      return redirect(
        urls.worldIdTab({
          team_id: params.teamId,
          app_id: params.appId,
          tab: WORLD_ID_TABS.Configuration,
          query: searchParams,
        }),
      );
    },
    () => <WorldId40Page params={params} />,
  );
}
