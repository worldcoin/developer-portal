import { renderPortalScene } from "@/lib/feature-flags/portal-v3";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AppIdPage as PortalV2AppIdPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/page";
import { AppIdPage as PortalV3AppIdPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Dashboard" }),
};

export default renderPortalScene(PortalV2AppIdPage, PortalV3AppIdPage);
