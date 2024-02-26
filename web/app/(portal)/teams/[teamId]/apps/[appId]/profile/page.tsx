import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfilePage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Profile/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "App profile" }),
};

export default AppProfilePage;
