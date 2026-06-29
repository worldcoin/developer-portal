import { renderPortalScene } from "@/lib/feature-flags/portal-v3";
import { TeamLayout } from "@/scenes/Portal/Teams/TeamId/Team/layout";
import { TeamLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Team/layout";

export default renderPortalScene(TeamLayout, TeamLayoutV3);
