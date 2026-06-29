import { V3Shell } from "@/scenes/PortalV3/Shell";
import { ReactNode } from "react";

type Params = {
  teamId?: string;
};

export const TeamIdLayoutV3 = async (props: {
  params: Promise<Params>;
  children: ReactNode;
}) => {
  const params = await props.params;

  return <V3Shell teamId={params.teamId}>{props.children}</V3Shell>;
};
