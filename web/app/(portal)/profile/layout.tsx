import { isPortalV3ForSession } from "@/lib/feature-flags/portal-v3/activation";
import { PortalLayout } from "@/scenes/PortalV3/layout";
import { ProfileLayout } from "@/scenes/Portal/Profile/layout";
import { ReactNode } from "react";

export default async function ProfileRouteLayout(props: {
  children: ReactNode;
}) {
  if (await isPortalV3ForSession()) {
    // Account-variant shell + the v2 profile sub-tabs (User profile / Teams /
    // Danger zone) kept in the content column so /profile/danger stays reachable.
    return (
      <PortalLayout variant="account">
        <ProfileLayout>{props.children}</ProfileLayout>
      </PortalLayout>
    );
  }
  return <ProfileLayout>{props.children}</ProfileLayout>;
}
