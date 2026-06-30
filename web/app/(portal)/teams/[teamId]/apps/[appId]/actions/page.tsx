import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Incognito actions" }),
};

// Compat route: there's no v3 Actions page yet, so this renders the v2
// ActionsPage directly. It still appears inside the v3 shell (mounted by the
// team/appId layouts); the v3 sidebar just doesn't link here.
export default ActionsPage;
