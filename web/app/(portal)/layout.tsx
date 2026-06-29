import { renderPortalScene } from "@/lib/feature-flags/portal-v3";
import { PortalLayout } from "@/scenes/Portal/layout";
import { PortalLayoutV3 } from "@/scenes/PortalV3/layout";

export default renderPortalScene(PortalLayout, PortalLayoutV3);
