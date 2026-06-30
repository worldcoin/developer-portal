import { isPortalV3ForSession } from "@/lib/feature-flags/portal-v3/activation";
import { PortalLayout } from "@/scenes/PortalV3/layout";
import { TeamIdLayout } from "@/scenes/Portal/Teams/TeamId/layout";
import { ComponentProps } from "react";

export default async function TeamRouteLayout(
  props: ComponentProps<typeof TeamIdLayout>,
) {
  if (await isPortalV3ForSession()) {
    // v3 shell resolves the current team client-side (useParams); no params prop.
    return <PortalLayout variant="app">{props.children}</PortalLayout>;
  }
  return <TeamIdLayout {...props} />;
}
