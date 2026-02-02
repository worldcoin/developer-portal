"use server";

/**
 * Get list of teams with World ID 4.0 enabled
 */
export const getWorldId40EnabledTeams = async (): Promise<string[]> => {
  const enabledTeams = await global.ParameterStore?.getParameter<string[]>(
    "world-id-4-0/enabled-teams",
    [],
  );

  return enabledTeams ?? [];
};

/**
 * Check if World ID 4.0 is enabled for a specific team
 */
export const isWorldId40EnabledForTeam = async (
  teamId: string | undefined,
): Promise<boolean> => {
  if (!teamId) return false;

  const enabledTeams = await getWorldId40EnabledTeams();

  return enabledTeams.includes(teamId);
};
