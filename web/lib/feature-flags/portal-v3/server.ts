"use server";

import { isWorldId40EnabledServer } from "@/lib/feature-flags/world-id-4-0/server";
import { isPortalV3EnabledForTeam } from "./common";

/**
 * Server-side check for whether the v3 portal is enabled for a team.
 * Subset rule: a team is only v3-eligible if World ID 4.0 is already enabled
 * for it (portal-v3 ⊆ world-id-4-0). Fails closed.
 */
export const isPortalV3EnabledServer = async (
  teamId: string | undefined,
): Promise<boolean> => {
  // Subset gate: never enable v3 for a team that is not on World ID 4.0.
  if (!(await isWorldId40EnabledServer(teamId))) {
    return false;
  }

  // Local-dev only: never let this env var override SSM in a deployed env.
  const localTeams =
    process.env.NODE_ENV === "development"
      ? process.env.LOCAL_DEV_PORTAL_V3_ENABLED_TEAMS?.split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
      : undefined;

  const enabledTeams = localTeams?.length
    ? localTeams
    : await global.ParameterStore?.getParameter<string[]>(
        "portal-v3/enabled-teams",
        [],
      );

  return isPortalV3EnabledForTeam(enabledTeams, teamId);
};
