import {
  isPortalV3EnabledServer,
  isWorldId40EnabledServer,
  PortalV3Provider,
  WorldId40Provider,
} from "@/lib/feature-flags";
import { parseTheme, THEME_COOKIE } from "@/lib/portal-v3/theme";
import { V3Shell } from "@/scenes/PortalV3/Shell";
import { cookies } from "next/headers";
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

  const [isWorldId40Enabled, isPortalV3Enabled] = await Promise.all([
    isWorldId40EnabledServer(teamId),
    isPortalV3EnabledServer(teamId),
  ]);

  const worldId40Teams = isWorldId40Enabled && teamId ? [teamId] : [];
  const portalV3Teams = isPortalV3Enabled && teamId ? [teamId] : [];

  const theme = isPortalV3Enabled
    ? parseTheme((await cookies()).get(THEME_COOKIE)?.value)
    : "light";

  return (
    <WorldId40Provider enabledTeams={worldId40Teams}>
      <PortalV3Provider enabledTeams={portalV3Teams}>
        {isPortalV3Enabled ? (
          <V3Shell teamId={teamId} theme={theme}>
            {props.children}
          </V3Shell>
        ) : (
          props.children
        )}
      </PortalV3Provider>
    </WorldId40Provider>
  );
};
