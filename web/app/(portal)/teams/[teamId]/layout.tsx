import { renderPortalScene } from "@/lib/feature-flags/portal-v3/render-portal-scene";
import { TeamIdLayout } from "@/scenes/Portal/Teams/TeamId/layout";
import { TeamIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/layout";

export default renderPortalScene(TeamIdLayout, TeamIdLayoutV3);
