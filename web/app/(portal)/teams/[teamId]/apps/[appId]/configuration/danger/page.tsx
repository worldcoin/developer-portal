import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { AppProfileDangerPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/Danger/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ teamId: string; appId: string }> };

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default async function Page(props: Props) {
  const params = await props.params;
  return pickPortalVersion(
    // v3: Danger zone is a section on the Configuration page; the standalone
    // page was removed. Send any direct hits to the Configuration page.
    () =>
      redirect(
        urls.configuration({ team_id: params.teamId, app_id: params.appId }),
      ),
    () => <AppProfileDangerPage params={params} />,
  );
}
