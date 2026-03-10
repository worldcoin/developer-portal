export const WORLD_ID_40_ENABLE_ALL_TEAMS_TOKEN = "enable_all_teams";

const getLegacyActionsEditableTeams = () =>
  (process.env.NEXT_PUBLIC_LEGACY_ACTIONS_EDITABLE_TEAM_IDS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

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
    return entry === WORLD_ID_40_ENABLE_ALL_TEAMS_TOKEN || entry === teamId;
  });
};

export const isLegacyActionsEditableForTeam = (
  teamId: string | undefined,
): boolean => {
  if (!teamId) {
    return false;
  }

  return [
    // internal example team
    "team_f8bdaaa2da5b9779b9dbd6ab82a705a2",
    // partner team that we want to support legacy actions editing for
    "team_47d749c71e3627c69f3a59fc1b21b2ae",
  ].includes(teamId);
};
