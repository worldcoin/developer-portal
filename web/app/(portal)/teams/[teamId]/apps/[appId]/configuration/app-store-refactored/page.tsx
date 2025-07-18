import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfileGalleryPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppStoreRefactored/index";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Mini Apps" }),
};

export default AppProfileGalleryPage;
