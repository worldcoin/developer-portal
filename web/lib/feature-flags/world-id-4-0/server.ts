"use server";

import { isWorldId40EnabledForTeam } from "./common";

/**
 * Server-side helper to check if World ID 4.0 is enabled for a team.
 * Fetches Parameter Store flag and applies common matching logic.
 */
export const isWorldId40EnabledServer = async (
  teamId: string | undefined,
): Promise<boolean> => {
  const enabledTeams = await global.ParameterStore?.getParameter<string[]>(
    "world-id-4-0/enabled-teams",
    [],
  );
  return isWorldId40EnabledForTeam(enabledTeams, teamId);
};
