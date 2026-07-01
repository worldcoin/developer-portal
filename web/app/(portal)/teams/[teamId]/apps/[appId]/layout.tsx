import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { AppIdLayout as AppIdLayoutV2 } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout";
import { AppIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout";
import { ReactNode } from "react";
import { AppLayoutRouteParams } from "./layout-params";

type Props = { params: AppLayoutRouteParams; children: ReactNode };

export default async function Layout(props: Props) {
  const params = await props.params;
  const { children } = props;
  return pickPortalVersion(
    () => <AppIdLayout params={params}>{children}</AppIdLayout>,
    () => <AppIdLayoutV2 params={params}>{children}</AppIdLayoutV2>,
  );
}
