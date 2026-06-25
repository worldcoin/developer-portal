export const PORTAL_V3_ENABLE_ALL_TEAMS_TOKEN = "enable_all_teams";

/**
 * Shared portal-v3 team-gating logic.
 * Supports explicit team IDs and a global override token.
 */
export const isPortalV3EnabledForTeam = (
  enabledTeams: string[] | undefined,
  teamId: string | undefined,
): boolean => {
  if (!teamId || !enabledTeams?.length) {
    return false;
  }

  return enabledTeams.some((rawEntry) => {
    const entry = rawEntry.trim();
    return entry === PORTAL_V3_ENABLE_ALL_TEAMS_TOKEN || entry === teamId;
  });
};
