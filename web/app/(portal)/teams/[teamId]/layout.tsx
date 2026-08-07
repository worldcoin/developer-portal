import { TeamIdLayout as TeamIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/layout";
import { ReactNode } from "react";

export default async function Layout(props: {
  params: Promise<{ teamId?: string }>;
  children: ReactNode;
}) {
  return (
    <TeamIdLayoutV3 params={props.params}>{props.children}</TeamIdLayoutV3>
  );
}
