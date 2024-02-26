import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfileLinksPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Profile/Links/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Links" }),
};

export default AppProfileLinksPage;
