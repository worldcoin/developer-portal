"use client";

import { atom } from "jotai";

type WorldId40Config = {
  isFetched: boolean;
  enabledTeams: string[];
};

export const worldId40Atom = atom<WorldId40Config>({
  isFetched: false,
  enabledTeams: [],
});

/**
 * Client-side helper to check if World ID 4.0 is enabled for a team
 */
export const isWorldId40Enabled = (
  config: WorldId40Config,
  teamId: string | undefined,
): boolean => {
  if (!teamId || !config.isFetched) return false;
  return config.enabledTeams.includes(teamId);
};
