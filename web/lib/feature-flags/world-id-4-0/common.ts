import { checkIfProduction } from "@/lib/utils";

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
    return entry === WORLD_ID_40_ENABLE_ALL_TEAMS_TOKEN || entry === teamId;
  });
};

export const isLegacyActionsEditableForTeam = (
  teamId: string | undefined,
): boolean => {
  if (!teamId) {
    return false;
  }

  let legacyEnabledTeams: string[];

  if (checkIfProduction()) {
    legacyEnabledTeams = [
      // TFH teams
      "team_f8bdaaa2da5b9779b9dbd6ab82a705a2", // World ID
      "team_56592d0d26de476126ae29a3904df44e", // World ID Deep Face
      // Partner teams
      "team_47d749c71e3627c69f3a59fc1b21b2ae", // Tinder
    ];
  } else {
    legacyEnabledTeams = [
      // TFH teams
      "team_653e1d90daf143a7ce19c6752f48899e", // World ID
    ];
  }

  return legacyEnabledTeams.includes(teamId);
};
