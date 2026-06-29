import { renderPortalScene } from "@/lib/feature-flags/portal-v3/render-portal-scene";
import { ProfileLayout } from "@/scenes/Portal/Profile/layout";
import { ProfileLayoutV3 } from "@/scenes/PortalV3/Profile/layout";

export default renderPortalScene(ProfileLayout, ProfileLayoutV3);
