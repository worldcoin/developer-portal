import "server-only";
import { isPortalV3Enabled, isPortalV3EnabledForEmail } from "./portal-v3/flag";

/**
 * Single entry point for every feature flag: featureFlags.<feature>.<accessor>.
 * New flags register here; call sites never import flag modules directly, so
 * `featureFlags.` autocomplete enumerates everything that can gate behavior.
 * Server-only by construction — a future client-side flag needs its own
 * client entry point, not a spot in this object.
 */
export const featureFlags = {
  portalV3: {
    isEnabled: isPortalV3Enabled,
    isEnabledForEmail: isPortalV3EnabledForEmail,
  },
} as const;
