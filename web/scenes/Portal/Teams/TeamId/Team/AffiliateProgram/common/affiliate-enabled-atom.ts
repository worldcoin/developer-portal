import { atom } from "jotai";

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
): boolean => {
  if (!teamId) return false;

  return (
    config.enabledParameter ||
    (config.enabledTeamsParameter.length > 0 &&
      config.enabledTeamsParameter.includes(teamId))
  );
};
