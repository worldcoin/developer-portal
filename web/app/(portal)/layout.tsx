import { isPortalV3ForSession } from "@/lib/feature-flags/portal-v3/activation";
import { PortalLayout as PortalLayoutV2 } from "@/scenes/Portal/layout";
import { ReactNode } from "react";

// Single per-email activation point. For v3 the root is thin (no v2 Header), so
// section layouts own the chrome and v3 routes never inherit the v2 header
// (no double-header). v2 path is unchanged. Auth is enforced in middleware.
export default async function PortalRootLayout(props: { children: ReactNode }) {
  if (await isPortalV3ForSession()) {
    return <>{props.children}</>;
  }
  return <PortalLayoutV2>{props.children}</PortalLayoutV2>;
}
