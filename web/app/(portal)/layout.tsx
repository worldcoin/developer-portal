import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { PortalLayout as PortalLayoutV2 } from "@/scenes/Portal/layout";
import { ReactNode } from "react";

// Thin root for v3 (no v2 Header); section layouts own the chrome. v2 unchanged.
// Auth is enforced in middleware.
export default async function PortalRootLayout(props: { children: ReactNode }) {
  return pickPortalVersion(
    () => <>{props.children}</>,
    () => <PortalLayoutV2>{props.children}</PortalLayoutV2>,
  );
}
