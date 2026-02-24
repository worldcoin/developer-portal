export const WORLD_ID_40_ENABLE_ALL_TEAMS_TOKEN = "enable_all_teams";

/**
 * Shared World ID 4.0 team-gating logic.
 * Supports explicit team IDs and a global override token.
 */
export const isWorldId40EnabledForTeam = (
  enabledTeams: string[] | undefined,
  teamId: string | undefined,
): boolean => {
  if (!teamId || !enabledTeams?.length) {
    return false;
  }

  return enabledTeams.some((rawEntry) => {
    const entry = rawEntry.trim();
    return (
      entry === WORLD_ID_40_ENABLE_ALL_TEAMS_TOKEN || entry === teamId
    );
  });
};
