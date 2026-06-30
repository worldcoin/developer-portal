import "server-only";

/**
 * Global kill-switch. When "true", v3 is forced on for everyone (local dev /
 * full rollout). Any other value (unset, "1", "false") is off — fail-safe to v2.
 */
export const isPortalV3Enabled = (): boolean =>
  process.env.LOCAL_DEV_PORTAL_V3_ENABLED === "true";

/**
 * Per-user v3 activation by email. v3 is on when the global switch is on, or
 * when the user's email is in the PORTAL_V3_EMAILS allow-list (comma-separated,
 * case-insensitive). No email -> off. Synchronous (env read) so it composes
 * with the chooser and needs no AWS/SSM dependency.
 */
export const isPortalV3EnabledForEmail = (email?: string | null): boolean => {
  if (isPortalV3Enabled()) {
    return true;
  }
  if (!email) {
    return false;
  }
  const allow = (process.env.PORTAL_V3_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
};
