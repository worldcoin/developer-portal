import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfilePage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Basic" }),
};

export default AppProfilePage;
