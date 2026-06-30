import { isPortalV3ForSession } from "@/lib/feature-flags/portal-v3/activation";
import { TeamLayout } from "@/scenes/Portal/Teams/TeamId/Team/layout";
import { ComponentProps } from "react";

export default async function TeamTabsLayout(
  props: ComponentProps<typeof TeamLayout>,
) {
  if (await isPortalV3ForSession()) {
    // The v3 sidebar replaces the team tab bar.
    return <>{props.children}</>;
  }
  return <TeamLayout {...props} />;
}
