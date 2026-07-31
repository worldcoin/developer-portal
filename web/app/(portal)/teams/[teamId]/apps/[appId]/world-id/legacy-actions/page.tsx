import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { LegacyActionsPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/LegacyActions/page";
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
    () => <LegacyActionsPage params={props.params} />,
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
