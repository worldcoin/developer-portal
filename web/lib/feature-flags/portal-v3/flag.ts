import "server-only";

/**
 * Local-only kill switch for Developer Portal v3.
 *
 * Gated on LOCAL_DEV_PORTAL_V3_ENABLED so v3 stays off in every deployed
 * environment unless an engineer explicitly sets the var to the exact string
 * "true" in their local shell. Any other value (unset, "1", "false", "TRUE")
 * is treated as off — fail-safe to the v2 experience.
 */
export const isPortalV3Enabled = (): boolean =>
  process.env.LOCAL_DEV_PORTAL_V3_ENABLED === "true";
