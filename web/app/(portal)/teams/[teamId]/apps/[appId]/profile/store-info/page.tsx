import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfileStoreInfoPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Profile/StoreInfo/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Store info" }),
};

export default AppProfileStoreInfoPage;
