"use server";
import { cache } from "react";

/**
 * Server-side check: is the v3 portal enabled?
 * Local dev: set LOCAL_DEV_PORTAL_V3_ENABLED=true.
 * Production: SSM parameter portal-v3/enabled (boolean).
 * Fails closed.
 *
 * Wrapped with React.cache() so all layouts on the same request share one call.
 */
export const isPortalV3EnabledServer = cache(async (): Promise<boolean> => {
  if (process.env.NODE_ENV === "development") {
    return process.env.LOCAL_DEV_PORTAL_V3_ENABLED === "true";
  }

  const value = await global.ParameterStore?.getParameter<boolean>(
    "portal-v3/enabled",
    false,
  );
  // SSM returns strings at the wire level; String() coercion handles both boolean true and "true".
  return String(value) === "true";
});
