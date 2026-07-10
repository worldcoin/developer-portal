import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { AppVersionsPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Versions/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ teamId: string; appId: string }> };

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Versions" }),
};

export default async function Page(props: Props) {
  const params = await props.params;
  return pickPortalVersion(
    () => <AppVersionsPage params={params} />,
    () =>
      redirect(
        urls.configuration({
          team_id: params.teamId,
          app_id: params.appId,
        }),
      ),
  );
}
