import "server-only";

/**
 * Teams whose members see the WID sandbox distribution tile. Set per
 * environment in world-id-deploy (parameters.ts), comma-separated; unset or
 * empty means no one — fail-safe off. Read at evaluation time, not module
 * scope, so a task-definition change needs no code change here.
 */
export const getSandboxTeams = (): string[] =>
  (process.env.WORLD_ID_SANDBOX_TEAM_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
