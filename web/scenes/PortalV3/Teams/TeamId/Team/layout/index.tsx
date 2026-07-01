import { ReactNode } from "react";

type Params = {
  teamId?: string;
};

type TeamLayoutProps = {
  params: Promise<Params>;
  children: ReactNode;
};

// v3 team layout: the PortalV3 Shell/SidebarNav already renders the team-level
// nav, so this layout is a pass-through (no tab bar) to avoid a double-nav.
// params is accepted (and awaited) to keep the same signature as the v2 layout.
export const TeamLayout = async (props: TeamLayoutProps) => {
  await props.params;
  return <>{props.children}</>;
};
