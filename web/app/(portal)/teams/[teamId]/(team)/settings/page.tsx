import { generateMetaTitle } from "@/lib/generate-title";
import { TeamSettingsPage } from "@/scenes/PortalV3/Teams/TeamId/Team/Settings/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Team settings" }),
};

type TeamSettingsSearchParams = {
  tab?: string | string[];
};

export default async function Page(
  props: { searchParams?: Promise<TeamSettingsSearchParams> } = {},
) {
  const searchParams = (await props.searchParams) ?? {};

  return <TeamSettingsPage requestedTab={searchParams.tab} />;
}
