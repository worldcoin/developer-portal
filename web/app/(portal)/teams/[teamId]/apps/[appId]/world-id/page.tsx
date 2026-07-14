import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { WorldIdPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "World ID" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  return pickPortalVersion(
    () => <WorldIdPage params={params} searchParams={searchParams} />,
    () =>
      redirect(
        urls.worldId40({ team_id: params.teamId, app_id: params.appId }),
      ),
  );
}
