import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfileDangerPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/Danger/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default AppProfileDangerPage;
