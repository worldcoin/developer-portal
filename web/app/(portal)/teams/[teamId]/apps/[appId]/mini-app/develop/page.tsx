import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { DevelopPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Develop/page";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
};

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Develop" }),
};

export default async function Page(props: Props) {
  const params = await props.params;
  const ids = { team_id: params.teamId, app_id: params.appId };

  return pickPortalVersion(
    () => <DevelopPage params={Promise.resolve(params)} />,
    () => redirect(urls.miniAppPermissions(ids)),
  );
}
