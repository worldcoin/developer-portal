import "server-only";
import { cache } from "react";
import { auth0 } from "@/lib/auth0";
import { Auth0SessionUser } from "@/lib/types";
import { isPortalV3EnabledForEmail } from "@/lib/feature-flags/portal-v3/flag";

/**
 * Per-email v3 activation, decided once from the Auth0 session and re-used by
 * every (portal) route shim. Async because the email comes from the session;
 * isPortalV3EnabledForEmail already folds in the global LOCAL_DEV switch, so no
 * session (kiosk / signed-out) → undefined email → v2. cache() dedupes the
 * getSession() across all shims in a single request render.
 */
export const isPortalV3ForSession = cache(async (): Promise<boolean> => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  return isPortalV3EnabledForEmail(user?.email);
});
