"use server";

/**
 * Check if World ID 4.0 is enabled for a specific team
 */
export const isWorldId40EnabledForTeam = async (
  teamId: string | undefined,
): Promise<boolean> => {
  if (!teamId) return false;

  const enabledTeams = await global.ParameterStore?.getParameter(
    "world-id-4-0/enabled-teams",
    [] as string[],
  );

  return enabledTeams?.includes(teamId) ?? false;
};
