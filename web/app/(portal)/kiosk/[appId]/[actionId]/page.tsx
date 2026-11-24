import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdKioskPage } from "@/scenes/PortalV3/Kiosk";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Kiosk" }),
  appleWebApp: {
    title: "World ID Kiosk",
    statusBarStyle: "black-translucent",
  },
};

export default ActionIdKioskPage;
