import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { TeamIdPage } from "@/scenes/Portal/Teams/TeamId/Team/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Overview" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  return pickPortalVersion(
    () => redirect(urls.teamSettings({ team_id: params.teamId })),
    () => <TeamIdPage params={params} searchParams={searchParams} />,
  );
}
