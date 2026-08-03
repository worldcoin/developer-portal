import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { TeamIdLayout as TeamIdLayoutV2 } from "@/scenes/Portal/Teams/TeamId/layout";
import { TeamIdLayout as TeamIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/layout";
import { ReactNode } from "react";

export default async function Layout(props: {
  params: Promise<{ teamId?: string }>;
  children: ReactNode;
}) {
  return pickPortalVersion(
    () => (
      <TeamIdLayoutV3 params={props.params}>{props.children}</TeamIdLayoutV3>
    ),
    () => (
      <TeamIdLayoutV2 params={props.params}>{props.children}</TeamIdLayoutV2>
    ),
  );
}
