import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfileGalleryPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Profile/Gallery/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Gallery" }),
};

export default AppProfileGalleryPage;
