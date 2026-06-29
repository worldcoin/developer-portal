import { isPortalV3EnabledForTeam } from "@/lib/feature-flags/portal-v3/flag";
import { AppIdLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout";
import { AppIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout";
import { ReactNode } from "react";
import { AppLayoutRouteParams } from "./layout-params";

type Props = {
  params: AppLayoutRouteParams;
  children: ReactNode;
};

// Gate on the SAME per-team flag as the parent team layout (not the env-only
// chooser). This layout always runs — even under a v2 team — so it must make
// the same v2/v3 decision as the team layout, or an app page would mix v2 app
// chrome (AppIdChrome) with the v3 shell. A v3 team → AppIdLayoutV3 (no chrome,
// the shell supplies it); a v2 team → the v2 AppIdLayout with AppIdChrome.
export default async function Layout(props: Props) {
  const params = await props.params;
  const Layout = (await isPortalV3EnabledForTeam(params.teamId))
    ? AppIdLayoutV3
    : AppIdLayout;
  return <Layout params={params}>{props.children}</Layout>;
}
