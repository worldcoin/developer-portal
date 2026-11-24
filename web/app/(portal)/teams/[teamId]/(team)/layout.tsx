import { TeamLayout } from "@/scenes/PortalV3/Teams/TeamId/Team/layout";
import { ReactNode } from "react";

export default function Layout(props: {
  params: Promise<Record<string, string>>;
  children: ReactNode;
}) {
  return <TeamLayout params={props.params}>{props.children}</TeamLayout>;
}
