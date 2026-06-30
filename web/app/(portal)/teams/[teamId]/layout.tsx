import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { PortalLayout } from "@/scenes/PortalV3/layout";
import { TeamIdLayout } from "@/scenes/Portal/Teams/TeamId/layout";
import { ComponentProps } from "react";

export default async function TeamRouteLayout(
  props: ComponentProps<typeof TeamIdLayout>,
) {
  return pickPortalVersion(
    () => <PortalLayout variant="app">{props.children}</PortalLayout>,
    () => <TeamIdLayout {...props} />,
  );
}
