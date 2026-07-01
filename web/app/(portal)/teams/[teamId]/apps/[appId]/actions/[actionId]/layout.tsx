import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { ActionIdLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/layout";
import { ActionIdLayout as ActionIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/layout";
import { ReactNode } from "react";

type Props = { params: Promise<Record<string, string>>; children: ReactNode };

export default async function ActionIdLayoutRoute(props: Props) {
  return pickPortalVersion(
    () => (
      <ActionIdLayoutV3 params={props.params}>
        {props.children}
      </ActionIdLayoutV3>
    ),
    () => (
      <ActionIdLayout params={props.params}>{props.children}</ActionIdLayout>
    ),
  );
}
