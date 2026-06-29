import { ComponentType, createElement } from "react";
import { isPortalV3Enabled } from "./flag";

export function pickPortalComponent<P>(
  V2: ComponentType<P>,
  V3: ComponentType<P> | null,
): ComponentType<P> {
  return isPortalV3Enabled() && V3 ? V3 : V2;
}

export function renderPortalScene<P extends object>(
  V2: ComponentType<P>,
  V3: ComponentType<P> | null,
) {
  return function PortalSceneChooser(props: P) {
    return createElement(pickPortalComponent(V2, V3), props);
  };
}
