import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { AppPermissionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/MiniApp/Permissions/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Permissions" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  const params = await props.params;

  return pickPortalVersion(
    () =>
      redirect(
        urls.miniAppDevelop({
          team_id: params.teamId,
          app_id: params.appId,
        }),
      ),
    () => <AppPermissionsPage params={Promise.resolve(params)} />,
  );
}
