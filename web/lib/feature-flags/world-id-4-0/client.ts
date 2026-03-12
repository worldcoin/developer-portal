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
 * World ID 4.0 is now enabled for all teams.
 */
export const isWorldId40Enabled = (
  _config: WorldId40Config,
  teamId: string | undefined,
): boolean => {
  return Boolean(teamId);
};
