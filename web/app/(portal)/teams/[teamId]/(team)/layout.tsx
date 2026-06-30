import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { TeamLayout } from "@/scenes/Portal/Teams/TeamId/Team/layout";
import { ComponentProps } from "react";

export default async function TeamTabsLayout(
  props: ComponentProps<typeof TeamLayout>,
) {
  return pickPortalVersion(
    () => <>{props.children}</>,
    () => <TeamLayout {...props} />,
  );
}
