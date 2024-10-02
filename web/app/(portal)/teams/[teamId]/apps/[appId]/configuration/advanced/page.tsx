import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfileSetupPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/Advanced/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Advanced Settings" }),
};

export default AppProfileSetupPage;
