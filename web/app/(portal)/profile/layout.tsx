import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { ProfileLayout } from "@/scenes/Portal/Profile/layout";
import { ProfileLayout as ProfileLayoutV3 } from "@/scenes/PortalV3/Profile/layout";
import { ReactNode } from "react";

export default async function ProfileRouteLayout(props: {
  children: ReactNode;
}) {
  return pickPortalVersion(
    () => <ProfileLayoutV3>{props.children}</ProfileLayoutV3>,
    () => <ProfileLayout>{props.children}</ProfileLayout>,
  );
}
