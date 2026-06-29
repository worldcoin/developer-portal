import { createElement, type ComponentType, type JSX } from "react";
import { isPortalV3Enabled } from "@/lib/feature-flags/portal-v3/flag";

/**
 * Pick the v3 component when the flag is on and a v3 counterpart exists,
 * otherwise fall back to the copied v2 component.
 *
 * Synchronous on purpose — isPortalV3Enabled() is a plain env read — so this
 * works in both server and client components without an await. Passing
 * V3 = null is the compat shim case: always renders the v2 component.
 */
export function pickPortalComponent<P>(
  V2: ComponentType<P>,
  V3: ComponentType<P> | null,
): ComponentType<P> {
  return isPortalV3Enabled() && V3 ? V3 : V2;
}

/**
 * Build a scene component that defers the v2/v3 choice to render time.
 * Used as the Style-A shim default export:
 *   export default renderPortalScene(V2Page, V3Page);
 * A compat route passes V3 = null so the v2 page renders inside the shell.
 */
export function renderPortalScene<P extends object>(
  V2: ComponentType<P>,
  V3: ComponentType<P> | null,
): (props: P) => JSX.Element {
  const PortalScene = (props: P) =>
    createElement(pickPortalComponent(V2, V3), props);
  // Named so it shows up in React DevTools / stacks instead of "Anonymous"
  // (also satisfies the react/display-name lint rule).
  PortalScene.displayName = "PortalScene";
  return PortalScene;
}
