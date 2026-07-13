import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldIdActionIdLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/layout";
import { ReactNode } from "react";

export default async function Layout(props: {
  params: Promise<Record<string, string>>;
  children: ReactNode;
}) {
  // v3 action detail lives at /world-id/actions/[id]; the page here redirects
  // there, so the v3 branch just passes children through (no v2 "Back to
  // Actions" chrome).
  return pickPortalVersion(
    () => <>{props.children}</>,
    () => (
      <WorldIdActionIdLayout params={props.params}>
        {props.children}
      </WorldIdActionIdLayout>
    ),
  );
}
