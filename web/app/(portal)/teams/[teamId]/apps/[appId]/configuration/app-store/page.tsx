import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfileGalleryPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppStore/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Miniapps" }),
};

export default AppProfileGalleryPage;
