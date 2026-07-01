import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamIdPage } from "@/scenes/Portal/Teams/TeamId/Team/page";
import { TeamIdPage as TeamIdPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Team/page";
import { Metadata } from "next";

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
    () => <TeamIdPageV3 params={params} searchParams={searchParams} />,
    () => <TeamIdPage params={params} searchParams={searchParams} />,
  );
}
