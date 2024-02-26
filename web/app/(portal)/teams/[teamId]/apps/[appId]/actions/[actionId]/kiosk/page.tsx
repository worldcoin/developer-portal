import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdKioskPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Kiosk";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Kiosk" }),
};

export default ActionIdKioskPage;
