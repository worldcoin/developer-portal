import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
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
  const worldIdPath = urls.worldId40({
    team_id: params.teamId,
    app_id: params.appId,
  });

  return pickPortalVersion(
    () => {
      if (searchParams.enableWorldId4 === "true") {
        return redirect(`${worldIdPath}?enableWorldId4=true`);
      }
      return redirect(worldIdPath);
    },
    () => <AppIdPage params={props.params} />,
  );
}
