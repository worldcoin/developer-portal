import { ActionIdLayout as ActionIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/layout";
import { ReactNode } from "react";

export default async function Layout(props: {
  params: Promise<Record<string, string>>;
  children: ReactNode;
}) {
  return (
    <ActionIdLayoutV3 params={props.params}>{props.children}</ActionIdLayoutV3>
  );
}
