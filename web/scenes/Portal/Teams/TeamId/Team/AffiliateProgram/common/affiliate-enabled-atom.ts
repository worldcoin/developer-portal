import { atom } from "jotai";
import { Auth0SessionUser } from "@/lib/types";
import { isAffiliateKycEnabled } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/is-affiliate-kyc-enabled";

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

  if (!isTeamMember) {
    return false;
  }

  // Email allowlist (and non-prod): full affiliate access without verified apps.
  if (isAffiliateKycEnabled(user?.email)) {
    return true;
  }

  // Production users not on the list: require at least one verified app on the team.
  return config.isFetched && config.teamVerifiedAppsCount > 0;
};
