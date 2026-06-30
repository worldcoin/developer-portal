import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { PortalLayout as PortalLayoutV2 } from "@/scenes/Portal/layout";
import { PortalLayout as PortalLayoutV3 } from "@/scenes/PortalV3/layout";
import { ReactNode } from "react";

// Single per-email activation point. For allow-listed users the v3 shell mounts
// here at the (portal) root; nested route layouts stay plain v2. Auth is
// enforced in middleware.
export default async function PortalRootLayout(props: { children: ReactNode }) {
  return pickPortalVersion(
    () => <PortalLayoutV3>{props.children}</PortalLayoutV3>,
    () => <PortalLayoutV2>{props.children}</PortalLayoutV2>,
  );
}
