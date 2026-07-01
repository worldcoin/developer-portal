import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { TeamLayout } from "@/scenes/Portal/Teams/TeamId/Team/layout";
import { TeamLayout as TeamLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Team/layout";
import { ReactNode } from "react";

export default async function Layout(props: {
  params: Promise<{ teamId?: string }>;
  children: ReactNode;
}) {
  return pickPortalVersion(
    () => <TeamLayoutV3 params={props.params}>{props.children}</TeamLayoutV3>,
    () => <TeamLayout params={props.params}>{props.children}</TeamLayout>,
  );
}
