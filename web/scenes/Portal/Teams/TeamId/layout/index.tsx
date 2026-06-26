import { isPortalV3EnabledServer } from "@/lib/feature-flags";
import { V3Shell } from "@/scenes/PortalV3/Shell";
import { ReactNode } from "react";

type Params = {
  teamId?: string;
};

type TeamIdLayoutProps = {
  params: Promise<Params>;
  children: ReactNode;
};

export const TeamIdLayout = async (props: TeamIdLayoutProps) => {
  const params = await props.params;
  const teamId = params.teamId;

  const isV3 = await isPortalV3EnabledServer();

  if (isV3) {
    return <V3Shell teamId={teamId}>{props.children}</V3Shell>;
  }

  return <>{props.children}</>;
};
