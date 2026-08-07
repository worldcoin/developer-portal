import { MiniAppLayout as MiniAppLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/layout";
import { ReactNode } from "react";

export default async function Layout(props: { children: ReactNode }) {
  return <MiniAppLayoutV3>{props.children}</MiniAppLayoutV3>;
}
