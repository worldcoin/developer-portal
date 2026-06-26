import { isPortalV3EnabledServer, PortalV3Provider } from "@/lib/feature-flags";
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

  const isPortalV3Enabled = await isPortalV3EnabledServer(teamId);
  const portalV3Teams = isPortalV3Enabled && teamId ? [teamId] : [];

  return (
    <PortalV3Provider enabledTeams={portalV3Teams}>
      {isPortalV3Enabled ? (
        <V3Shell teamId={teamId}>{props.children}</V3Shell>
      ) : (
        props.children
      )}
    </PortalV3Provider>
  );
};
