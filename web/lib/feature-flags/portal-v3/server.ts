"use server";

import { isPortalV3EnabledForTeam } from "./common";

/**
 * Server-side check for whether the v3 portal is enabled for a team.
 * Standalone SSM allowlist (portal-v3/enabled-teams) with a local-dev override.
 * Fails closed.
 *
 * (Previously gated on World ID 4.0 — portal-v3 ⊆ world-id-4-0 — but the WID-4.0
 * rollout flag was removed in #1974, so 4.0 is always available and the subset
 * precondition no longer applies.)
 */
export const isPortalV3EnabledServer = async (
  teamId: string | undefined,
): Promise<boolean> => {
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
