import { ReactNode } from "react";

type Params = {
  teamId?: string;
};

type TeamLayoutProps = {
  params: Promise<Params>;
  children: ReactNode;
};

// v3: the old team tab layout was folded into the PortalV3 sidebar and the
// combined Team settings page, so this layout is a deliberate pass-through to
// avoid a double nav.
export const TeamLayout = async (props: TeamLayoutProps) => {
  return <>{props.children}</>;
};
