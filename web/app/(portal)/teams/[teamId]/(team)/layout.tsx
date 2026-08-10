import { TeamLayout as TeamLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Team/layout";
import { ReactNode } from "react";

export default async function Layout(props: {
  params: Promise<Record<string, string>>;
  children: ReactNode;
}) {
  return <TeamLayoutV3 params={props.params}>{props.children}</TeamLayoutV3>;
}
