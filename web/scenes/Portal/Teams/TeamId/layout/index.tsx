import {
  isWorldId40EnabledServer,
  WorldId40Provider,
} from "@/lib/feature-flags";
import { ReactNode } from "react";

type Params = {
  teamId?: string;
};

type TeamIdLayoutProps = {
  params: Params;
  children: ReactNode;
};

export const TeamIdLayout = async (props: TeamIdLayoutProps) => {
  const isWorldId40Enabled = await isWorldId40EnabledServer(
    props.params.teamId,
  );
  const enabledTeams =
    isWorldId40Enabled && props.params.teamId ? [props.params.teamId] : [];

  return (
    <WorldId40Provider enabledTeams={enabledTeams}>
      {props.children}
    </WorldId40Provider>
  );
};
