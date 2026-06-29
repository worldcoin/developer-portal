"use client";

import { shouldRenderPortalV3Shell } from "@/lib/feature-flags/portal-v3/route-mode";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export const PortalHeaderGate = (props: { header: ReactNode }) => {
  const pathname = usePathname() ?? "";
  return shouldRenderPortalV3Shell(pathname) ? null : <>{props.header}</>;
};
