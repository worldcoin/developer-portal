import { atom } from "jotai";
import { Auth0SessionUser } from "@/lib/types";

type AffiliateEnabledType = {
  isFetched: boolean;
  teamVerifiedAppsCount: number;
};

export const affiliateEnabledAtom = atom<AffiliateEnabledType>({
  isFetched: false,
  teamVerifiedAppsCount: 0,
});

/**
 * Helper function to calculate if affiliate program is enabled for a specific team
 */
export const isAffiliateEnabledForTeam = (
  config: AffiliateEnabledType,
  teamId: string | undefined,
  user: Auth0SessionUser["user"],
): boolean => {
  if (!teamId) return false;

  const isTeamMember = user?.hasura?.memberships?.some(
    (membership) => membership.team?.id === teamId,
  );

  return Boolean(isTeamMember) && config.teamVerifiedAppsCount > 0;
};
