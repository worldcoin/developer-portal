import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdSettingsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Settings/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Settings" }),
};

export default ActionIdSettingsPage;
