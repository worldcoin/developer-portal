"use client";

import { atom } from "jotai";
import { isPortalV3EnabledForTeam } from "./common";

export type PortalV3Config = {
  isFetched: boolean;
  enabledTeams: string[];
};

export const portalV3Atom = atom<PortalV3Config>({
  isFetched: false,
  enabledTeams: [],
});

/**
 * Client-side check. The server already applied the world-id-4-0 subset gate
 * when computing enabledTeams, so this is a plain membership check.
 */
export const isPortalV3Enabled = (
  config: PortalV3Config,
  teamId: string | undefined,
): boolean => {
  if (!teamId || !config.isFetched) return false;
  return isPortalV3EnabledForTeam(config.enabledTeams, teamId);
};
