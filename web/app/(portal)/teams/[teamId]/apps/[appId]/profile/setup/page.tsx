import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfileSetupPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Profile/Setup/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Setup" }),
};

export default AppProfileSetupPage;
