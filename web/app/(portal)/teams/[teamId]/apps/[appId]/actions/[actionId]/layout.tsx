import { ActionIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/layout";
import { ReactNode } from "react";

export default function Layout(props: {
  params: Promise<Record<string, string>>;
  children: ReactNode;
}) {
  return (
    <ActionIdLayout params={props.params}>{props.children}</ActionIdLayout>
  );
}
