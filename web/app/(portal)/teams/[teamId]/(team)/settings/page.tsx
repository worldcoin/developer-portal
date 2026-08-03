import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamSettingsPage } from "@/scenes/Portal/Teams/TeamId/Team/Settings/page";
import { TeamSettingsPage as TeamSettingsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Team/Settings/page";
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

  return pickPortalVersion(
    () => <TeamSettingsPageV3 requestedTab={searchParams.tab} />,
    () => <TeamSettingsPage />,
  );
}
