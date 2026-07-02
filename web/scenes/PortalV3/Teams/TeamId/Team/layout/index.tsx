import { ReactNode } from "react";

type Params = {
  teamId?: string;
};

type TeamLayoutProps = {
  params: Promise<Params>;
  children: ReactNode;
};

// v3: the PortalV3 sidebar nav already renders the team tabs (Members / Apps /
// Settings / API keys / Danger), so this layout is a deliberate pass-through to
// avoid a double nav. The one intentional divergence from a byte copy.
export const TeamLayout = async (props: TeamLayoutProps) => {
  return <>{props.children}</>;
};
