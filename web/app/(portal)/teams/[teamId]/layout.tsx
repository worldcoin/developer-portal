import { isPortalV3EnabledForTeam } from "@/lib/feature-flags/portal-v3/flag";
import { TeamIdLayout } from "@/scenes/Portal/Teams/TeamId/layout";
import { TeamIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/layout";
import { ComponentProps } from "react";

// The team boundary is the single per-team v3 decision point: if the team has
// the flag on, the whole team subtree renders v3 (the shell), otherwise v2.
export default async function TeamIdRouteLayout(
  props: ComponentProps<typeof TeamIdLayout>,
) {
  const { teamId } = await props.params;
  const Layout = (await isPortalV3EnabledForTeam(teamId ?? ""))
    ? TeamIdLayoutV3
    : TeamIdLayout;
  return <Layout {...props} />;
}
