"use server";

/**
 * World ID 4.0 is now enabled for all teams.
 */
export const isWorldId40EnabledServer = async (
  teamId: string | undefined,
): Promise<boolean> => Boolean(teamId);
