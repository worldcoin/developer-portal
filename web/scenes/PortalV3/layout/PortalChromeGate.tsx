"use client";

import { Header } from "@/scenes/Portal/layout/Header";
import { Color } from "@/scenes/Portal/Profile/types";
import { usePathname } from "next/navigation";

export const PortalChromeGate = (props: { color: Color | null }) => {
  const pathname = usePathname() ?? "";

  // Hide the shared v2 Header only where v3 supplies its own chrome: the team
  // shell (/teams/<id>/**) or the profile rail (/profile/**). Everywhere else
  // — kiosk, the /teams index, v2 routes — keep the v2 Header.
  const v3Owns =
    /^\/teams\/[^/]+/.test(pathname) || pathname.startsWith("/profile");

  return v3Owns ? null : <Header color={props.color} />;
};
