"use client";

import { shouldRenderPortalV3Shell } from "@/lib/feature-flags/portal-v3/route-mode";
import { Header } from "@/scenes/Portal/layout/Header";
import { Color } from "@/scenes/Portal/Profile/types";
import { usePathname } from "next/navigation";

export const PortalChromeGate = (props: { color: Color | null }) => {
  const pathname = usePathname() ?? "";

  // When the v3 shell owns this route, it supplies its own chrome — suppress
  // the shared v2 Header. For kiosk/exempt + the /teams index, keep the v2
  // Header (shared chrome for v2/exempt routes).
  if (shouldRenderPortalV3Shell(pathname)) {
    return null;
  }

  return <Header color={props.color} />;
};
