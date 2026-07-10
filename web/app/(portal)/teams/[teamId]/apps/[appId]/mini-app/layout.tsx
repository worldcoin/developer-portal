import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { MiniAppLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/MiniApp/layout";
import { MiniAppLayout as MiniAppLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/layout";
import { ReactNode } from "react";

export default async function Layout(props: { children: ReactNode }) {
  return pickPortalVersion(
    () => <MiniAppLayoutV3>{props.children}</MiniAppLayoutV3>,
    () => <MiniAppLayout>{props.children}</MiniAppLayout>,
  );
}
