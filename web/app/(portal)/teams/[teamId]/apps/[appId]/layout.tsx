import { pickPortalComponent } from "@/lib/feature-flags/portal-v3/render-portal-scene";
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
  const C = pickPortalComponent(AppIdLayout, AppIdLayoutV3);
  return <C params={params}>{children}</C>;
}
