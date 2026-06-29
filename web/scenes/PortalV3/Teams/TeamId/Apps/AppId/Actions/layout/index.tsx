import { ReactNode } from "react";

type Params = {
  teamId: string;
  appId: string;
};

export const ActionsLayoutV3 = async (props: {
  params: Params;
  children: ReactNode;
}) => {
  await Promise.resolve(props.params);
  return <>{props.children}</>;
};
