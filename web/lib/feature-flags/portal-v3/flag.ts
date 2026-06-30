import "server-only";

/**
 * "true", v3 is turned on. Any other value (unset, "1", "false") is off. defaults to v2.
 * This also makes sure we don't accidentally globally turn for everyone in prod. 
 */
export const isPortalV3Enabled = (): boolean =>
  process.env.NODE_ENV !== "production" &&
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
