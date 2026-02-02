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
