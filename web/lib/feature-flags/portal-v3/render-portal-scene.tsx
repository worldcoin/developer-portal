import { type ComponentType } from "react";
import { isPortalV3Enabled } from "@/lib/feature-flags/portal-v3/flag";

/**
 * Pick the v3 component when the flag is on and a v3 counterpart exists,
 * otherwise fall back to the copied v2 component. A route shim renders the
 * result directly:
 *
 *   const Chosen = pickPortalComponent(V2Layout, V3Layout);
 *   return <Chosen {...props} />;
 *
 * Synchronous on purpose — isPortalV3Enabled() is a plain env read — so it
 * works in both server and client components without an await. Passing
 * V3 = null is the compat case (no v3 version yet): always renders v2.
 */
export function pickPortalComponent<P>(
  V2: ComponentType<P>,
  V3: ComponentType<P> | null,
): ComponentType<P> {
  return isPortalV3Enabled() && V3 ? V3 : V2;
}
