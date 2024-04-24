import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfileMiniAppPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Profile/MiniApp/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Mini App" }),
};

export default AppProfileMiniAppPage;
