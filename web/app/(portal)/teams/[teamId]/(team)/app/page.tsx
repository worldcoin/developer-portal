import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { AppsPage } from "@/scenes/Portal/Teams/TeamId/Team/Apps/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Apps" }),
};

type Props = { params: Promise<Record<string, string>> };

export default async function Page(props: Props) {
  const params = await props.params;

  return pickPortalVersion(
    () => redirect(urls.apps({ team_id: params.teamId })),
    () => <AppsPage />,
  );
}
