import {
  getWorldId40EnabledTeams,
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
  // Fetch World ID 4.0 enabled teams for feature flag
  const enabledTeams = await getWorldId40EnabledTeams();

  return (
    <WorldId40Provider enabledTeams={enabledTeams}>
      {props.children}
    </WorldId40Provider>
  );
};
