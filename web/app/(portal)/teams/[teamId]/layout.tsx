import { TeamIdLayout } from "@/scenes/PortalV3/Teams/TeamId/layout";
import { ReactNode } from "react";

export default function Layout(props: {
  params: Promise<{ teamId?: string }>;
  children: ReactNode;
}) {
  return <TeamIdLayout params={props.params}>{props.children}</TeamIdLayout>;
}
