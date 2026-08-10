import { AppIdLayout as AppIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/layout";
import { ReactNode } from "react";
import { AppLayoutRouteParams } from "./layout-params";

type Props = { params: AppLayoutRouteParams; children: ReactNode };

export default async function Layout(props: Props) {
  const params = await props.params;
  const { children } = props;
  return <AppIdLayoutV3 params={params}>{children}</AppIdLayoutV3>;
}
