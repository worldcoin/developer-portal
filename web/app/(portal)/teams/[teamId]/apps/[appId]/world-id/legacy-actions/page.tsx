import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Legacy Actions" }),
};

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
  searchParams: Promise<Record<string, string>>;
};

export default async function Page(props: Props) {
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
    async () => {
      const [params, searchParams] = await Promise.all([
        props.params,
        props.searchParams,
      ]);
      const legacyPath = urls.actions({
        team_id: params.teamId,
        app_id: params.appId,
      });
      const query = new URLSearchParams(searchParams).toString();

      return redirect(query ? `${legacyPath}?${query}` : legacyPath);
    },
  );
}
