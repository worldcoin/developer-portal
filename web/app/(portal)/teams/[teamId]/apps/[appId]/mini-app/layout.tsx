import { MiniAppLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/layout";
import { ReactNode } from "react";

export default function Layout(props: { children: ReactNode }) {
  return <MiniAppLayout>{props.children}</MiniAppLayout>;
}
