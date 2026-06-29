import { renderPortalScene } from "@/lib/feature-flags/portal-v3/render-portal-scene";
import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Incognito actions" }),
};

// Compat route: V3=null renders the existing v2 ActionsPage body inside the
// already-mounted v3 shell (the AppId v3 layout drops AppIdChrome). No v3
// Actions page is created; the v3 sidebar does not link here.
export default renderPortalScene(ActionsPage, null);
