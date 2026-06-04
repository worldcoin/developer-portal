import {
  isWorldId40EnabledServer,
  WorldId40Provider,
} from "@/lib/feature-flags";
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
  const isWorldId40Enabled = await isWorldId40EnabledServer(params.teamId);
  const enabledTeams =
    isWorldId40Enabled && params.teamId ? [params.teamId] : [];

  return (
    <WorldId40Provider enabledTeams={enabledTeams}>
      {props.children}
    </WorldId40Provider>
  );
};
