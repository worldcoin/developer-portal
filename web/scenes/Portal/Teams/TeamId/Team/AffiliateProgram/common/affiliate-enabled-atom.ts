import { atom } from "jotai";
import { Auth0SessionUser } from "@/lib/types";

export const affiliateEnabledAtom = atom<{
  isFetched: boolean;
  enabledParameter: boolean;
  enabledTeamsParameter: string[];
}>({
  isFetched: false,
  enabledParameter: false,
  enabledTeamsParameter: [],
});

/**
 * Helper function to calculate if affiliate program is enabled for a specific team
 */
export const isAffiliateEnabledForTeam = (
  config: { enabledParameter: boolean; enabledTeamsParameter: string[] },
  teamId: string | undefined,
  user: Auth0SessionUser["user"],
): boolean => {
  if (!teamId) return false;

  const isTeamMember = user?.hasura?.memberships?.some(
    (membership) => membership.team?.id === teamId,
  );

  return (
    Boolean(isTeamMember) &&
    (config.enabledParameter ||
      (config.enabledTeamsParameter.length > 0 &&
        config.enabledTeamsParameter.includes(teamId)))
  );
};
