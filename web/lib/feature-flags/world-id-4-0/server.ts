"use server";

/**
 * Check if World ID 4.0 is enabled for a specific team
 */
export const isWorldId40EnabledForTeam = async (
  teamId: string | undefined,
): Promise<boolean> => {
  if (!teamId) return false;

  const enabledTeams = await global.ParameterStore?.getParameter<string[]>(
    "world-id-4-0/enabled-teams",
    [],
  );

  return enabledTeams?.includes(teamId) ?? false;
};
