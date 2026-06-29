import { pickPortalComponent } from "@/lib/feature-flags/portal-v3/render-portal-scene";
import { TeamIdLayout } from "@/scenes/Portal/Teams/TeamId/layout";
import { TeamIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/layout";
import { ComponentProps } from "react";

export default function TeamIdRouteLayout(
  props: ComponentProps<typeof TeamIdLayout>,
) {
  const Layout = pickPortalComponent(TeamIdLayout, TeamIdLayoutV3);
  return <Layout {...props} />;
}
