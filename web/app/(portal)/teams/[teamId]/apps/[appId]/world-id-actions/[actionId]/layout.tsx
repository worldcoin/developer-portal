import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldIdActionIdLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/layout";
import { ReactNode } from "react";

export default async function Layout(props: {
  params: Promise<Record<string, string>>;
  children: ReactNode;
}) {
  return pickPortalVersion(
    () => <>{props.children}</>,
    () => (
      <WorldIdActionIdLayout params={props.params}>
        {props.children}
      </WorldIdActionIdLayout>
    ),
  );
}
