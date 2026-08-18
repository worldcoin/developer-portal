import { generateMetaTitle } from "@/lib/genarate-title";
import { NotificationsPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Notifications/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Notifications" }),
};

export default function Page() {
  return <NotificationsPage />;
}
