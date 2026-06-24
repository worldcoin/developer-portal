"use server";

import { isWorldId40EnabledForTeam } from "./common";

/**
 * Server-side helper to check if World ID 4.0 is enabled for a team.
 * Fetches Parameter Store flag and applies common matching logic.
 */
export const isWorldId40EnabledServer = async (
  teamId: string | undefined,
): Promise<boolean> => {
  // Local-dev only: never let this env var override the SSM source of truth in a
  // deployed environment (matches the NODE_ENV === "development" gating used in lib/utils).
  const localTeams =
    process.env.NODE_ENV === "development"
      ? process.env.LOCAL_DEV_WORLD_ID_40_ENABLED_TEAMS?.split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
      : undefined;

  const enabledTeams = localTeams?.length
    ? localTeams
    : await global.ParameterStore?.getParameter<string[]>(
        "world-id-4-0/enabled-teams",
        [],
      );

  return isWorldId40EnabledForTeam(enabledTeams, teamId);
};
