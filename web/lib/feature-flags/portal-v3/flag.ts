import "server-only";

/**
 * Global switch: "true" turns v3 on for everyone in the current environment;
 * any other value (unset, "1", "false") is off — fail-safe to v2. Leave it
 * unset in deployed environments; use PORTAL_V3_EMAILS for controlled rollout.
 */
export const isPortalV3Enabled = (): boolean =>
  process.env.LOCAL_DEV_PORTAL_V3_ENABLED === "true";

/**
 * Per-user v3 activation by email. v3 is on when the global switch is on, or
 * when the user's email is in the PORTAL_V3_EMAILS allow-list (comma-separated,
 * case-insensitive). No email -> off.
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
