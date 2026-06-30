import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { PortalLayout } from "@/scenes/PortalV3/layout";
import { ProfileLayout } from "@/scenes/Portal/Profile/layout";
import { ReactNode } from "react";

export default async function ProfileRouteLayout(props: {
  children: ReactNode;
}) {
  return pickPortalVersion(
    () => (
      <PortalLayout variant="account">
        <ProfileLayout>{props.children}</ProfileLayout>
      </PortalLayout>
    ),
    () => <ProfileLayout>{props.children}</ProfileLayout>,
  );
}
