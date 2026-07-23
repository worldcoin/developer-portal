import "server-only";
import { getFlagClient } from "../openfeature/provider";

/**
 * Global local/dev switch: "true" turns the sandbox tile on for every team
 * the user belongs to. Any other value (unset, "false") is off — fail-safe to
 * the WORLD_ID_SANDBOX_TEAM_IDS allowlist. Leave unset in deployed envs.
 */
export const isWorldIdSandboxEnabled = (): boolean =>
  process.env.LOCAL_DEV_WORLD_ID_SANDBOX_ENABLED === "true";

/**
 * Which of the given teams may see the sandbox tile. Context-heavy flags get
 * a thin typed wrapper here so call sites stay one line.
 */
export const getSandboxTeamIds = async (
  memberTeamIds: string[],
  email?: string | null,
): Promise<string[]> => {
  // Local override — skip OpenFeature / allowlist entirely (portal-v3 pattern).
  if (isWorldIdSandboxEnabled()) {
    return memberTeamIds;
  }

  const client = getFlagClient();
  const allowed = await Promise.all(
    memberTeamIds.map((teamId) =>
      client.getBooleanValue("sandbox-distribution", false, {
        targetingKey: email ?? "anonymous",
        teamId,
      }),
    ),
  );
  return memberTeamIds.filter((_, i) => allowed[i]);
};
