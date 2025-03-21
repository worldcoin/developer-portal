import { generateMetaTitle } from "@/lib/genarate-title";
import { NotificationsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Notifications/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Notifications" }),
};

export default NotificationsPage;
