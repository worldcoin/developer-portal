import { auth0 } from "@/lib/auth0";
import { isPortalV3EnabledForEmail } from "@/lib/feature-flags/portal-v3/flag";
import { Auth0SessionUser } from "@/lib/types";
import { cache } from "react";
import "server-only";

const isV3Active = cache(async (): Promise<boolean> => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  return isPortalV3EnabledForEmail(user?.email);
});

/**
 * Per-email v3 activation for (portal) route shims. Reads the session once per
 * request (cache()) and picks the v3 or v2 branch. No session (kiosk /
 * signed-out) → undefined email → v2.
 */
export async function pickPortalVersion<V3, V2>(
  v3: () => V3,
  v2: () => V2,
): Promise<V3 | V2> {
  return (await isV3Active()) ? v3() : v2();
}
