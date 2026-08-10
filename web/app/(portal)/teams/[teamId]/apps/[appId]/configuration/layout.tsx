import { AppProfileLayout as AppProfileLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/layout";
import { ReactNode } from "react";

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
  children: ReactNode;
};

export default async function Layout(props: Props) {
  const params = await props.params;
  const { children } = props;
  return <AppProfileLayoutV3 params={params}>{children}</AppProfileLayoutV3>;
}
