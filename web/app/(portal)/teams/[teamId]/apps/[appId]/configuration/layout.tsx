import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { AppProfileLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/layout";
import { AppProfileLayout as AppProfileLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/layout";
import { ReactNode } from "react";

type Props = {
  params: Promise<{
    teamId: string;
    appId: string;
  }>;
  children: ReactNode;
};

export default async function Layout(props: Props) {
  const params = await props.params;
  const { children } = props;
  return pickPortalVersion(
    () => <AppProfileLayoutV3 params={params}>{children}</AppProfileLayoutV3>,
    () => <AppProfileLayout params={params}>{children}</AppProfileLayout>,
  );
}
