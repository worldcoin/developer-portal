import { pickPortalComponent } from "@/lib/feature-flags/portal-v3";
import { AppIdLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout";
import { AppIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout";
import { ReactNode } from "react";
import { AppLayoutRouteParams } from "./layout-params";

type Props = {
  params: AppLayoutRouteParams;
  children: ReactNode;
};

export default async function Layout(props: Props) {
  const params = await props.params;
  const { children } = props;
  const Chosen = pickPortalComponent(AppIdLayout, AppIdLayoutV3);
  return <Chosen params={params}>{children}</Chosen>;
}
