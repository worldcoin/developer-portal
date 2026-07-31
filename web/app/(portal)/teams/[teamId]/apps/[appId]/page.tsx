import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import { AppIdPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Dashboard" }),
};

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
  searchParams: Promise<Record<string, string>>;
};

export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const ids = { team_id: params.teamId, app_id: params.appId };

  return pickPortalVersion(
    () => {
      if (searchParams.enableWorldId4 === "true") {
        return redirect(
          urls.worldIdTab({
            ...ids,
            tab: WORLD_ID_TABS.Configuration,
            query: { enableWorldId4: "true" },
          }),
        );
      }
      return redirect(urls.worldId(ids));
    },
    () => <AppIdPage params={props.params} />,
  );
}
