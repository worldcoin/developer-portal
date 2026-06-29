import { V3Shell } from "@/scenes/PortalV3/Shell";
import { ReactNode } from "react";

type Params = {
  teamId?: string;
};

type TeamIdLayoutV3Props = {
  params: Promise<Params>;
  children: ReactNode;
};

export const TeamIdLayoutV3 = async (props: TeamIdLayoutV3Props) => {
  const { teamId } = await props.params;

  return <V3Shell teamId={teamId}>{props.children}</V3Shell>;
};
