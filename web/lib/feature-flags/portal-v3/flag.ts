import "server-only";

/**
 * Local-only kill switch for Developer Portal v3.
 *
 * Gated on LOCAL_DEV_PORTAL_V3_ENABLED so v3 stays off in every deployed
 * environment unless "true" in local shell.
 */
export const isPortalV3Enabled = (): boolean =>
  process.env.LOCAL_DEV_PORTAL_V3_ENABLED === "true";

/**
 * Per-team Developer Portal v3 flag, backed by SSM Parameter Store
 * (`/developer-portal/portal-v3/enabled/<teamId>` → "true"/"false"), mirroring
 * the world-id-4.0 rollout pattern.
 *
 * Falls back to the LOCAL_DEV_PORTAL_V3_ENABLED env var when the parameter — or
 * Parameter Store itself (local dev / tests, where `global.ParameterStore` is
 * undefined) — is absent. Defaults to off (v2): fail-safe.
 */
export const isPortalV3EnabledForTeam = async (
  teamId: string,
): Promise<boolean> => {
  const fallback = isPortalV3Enabled();
  const value = await global.ParameterStore?.getParameter<string>(
    `portal-v3/enabled/${teamId}`,
    fallback ? "true" : "false",
  );
  return value === undefined ? fallback : value === "true";
};
