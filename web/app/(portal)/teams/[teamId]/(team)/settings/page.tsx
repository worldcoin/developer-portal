import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamSettingsPage } from "@/scenes/PortalV3/Teams/TeamId/Team/Settings/page";
import { TeamSettingsAnalyticsEligibility } from "@/scenes/PortalV3/layout/server/team-settings-analytics-eligibility";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Team settings" }),
};

type TeamSettingsSearchParams = {
  tab?: string | string[];
  return_to?: string | string[];
};

type TeamSettingsParams = {
  teamId?: string;
};

export default async function Page(
  props: {
    params?: Promise<TeamSettingsParams>;
    searchParams?: Promise<TeamSettingsSearchParams>;
  } = {},
) {
  const [params, searchParams]: [TeamSettingsParams, TeamSettingsSearchParams] =
    await Promise.all([
      props.params ?? Promise.resolve({}),
      props.searchParams ?? Promise.resolve({}),
    ]);
  return (
    <>
      <TeamSettingsAnalyticsEligibility
        teamId={params.teamId}
        returnTo={searchParams.return_to}
      />
      <TeamSettingsPage requestedTab={searchParams.tab} />
    </>
  );
}
