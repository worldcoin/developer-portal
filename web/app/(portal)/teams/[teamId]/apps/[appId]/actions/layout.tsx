import { pickPortalComponent } from "@/lib/feature-flags/portal-v3";
import { ActionsLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/layout";
import { ReactNode } from "react";
import { AppLayoutRouteParams } from "../layout-params";

type Props = {
  params: AppLayoutRouteParams;
  children: ReactNode;
};

const ActionsLayout = async (props: {
  params: { teamId: string; appId: string };
  children: ReactNode;
}) => {
  await Promise.resolve(props.params);
  return <>{props.children}</>;
};

export default async function Layout(props: Props) {
  const params = await props.params;
  const Chosen = pickPortalComponent(ActionsLayout, ActionsLayoutV3);
  return <Chosen params={params}>{props.children}</Chosen>;
}
