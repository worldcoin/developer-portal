import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldIdActionIdLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/layout";
import { WorldIdActionIdLayout as WorldIdActionIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/layout";
import { ReactNode } from "react";

export default async function Layout(props: {
  params: Promise<Record<string, string>>;
  children: ReactNode;
}) {
  return pickPortalVersion(
    () => (
      <WorldIdActionIdLayoutV3 params={props.params}>
        {props.children}
      </WorldIdActionIdLayoutV3>
    ),
    () => (
      <WorldIdActionIdLayout params={props.params}>
        {props.children}
      </WorldIdActionIdLayout>
    ),
  );
}
