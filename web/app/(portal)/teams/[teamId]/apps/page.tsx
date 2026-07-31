import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { AppsPage } from "@/scenes/Portal/Teams/TeamId/Apps/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Apps" }),
};

type Props = { params: Promise<Record<string, string>> };

export default async function Page(props: Props) {
  const params = await props.params;

  return pickPortalVersion(
    () => {
      // Portal V3 has one canonical team overview. Keep this legacy apps URL
      // working for bookmarks and old links without maintaining duplicate UI.
      return redirect(urls.teams({ team_id: params.teamId }));
    },
    () => <AppsPage params={Promise.resolve(params)} />,
  );
}
