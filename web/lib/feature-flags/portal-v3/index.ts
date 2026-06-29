// Public surface of the Portal v3 feature-flag layer. New consumers import from
// "@/lib/feature-flags/portal-v3" rather than deep paths.
export { isPortalV3Enabled } from "./flag";
export { pickPortalComponent } from "./render-portal-scene";
