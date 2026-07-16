import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { getIsUserAllowedToUpdateApp } from "@/lib/permissions";
import { WorldId40Page } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldId40/page";
import { WorldIdPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "World ID" }),
};

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
  searchParams: Promise<Record<string, string>>;
};

export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  return pickPortalVersion(
    async () => (
      <WorldIdPage
        params={params}
        searchParams={searchParams}
        canManageWorldId={await getIsUserAllowedToUpdateApp(params.appId)}
      />
    ),
    () => <WorldId40Page params={params} />,
  );
}
