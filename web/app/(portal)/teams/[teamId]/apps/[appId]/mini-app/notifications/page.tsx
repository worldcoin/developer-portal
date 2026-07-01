import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { NotificationsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/MiniApp/Notifications/page";
import { NotificationsPage as NotificationsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Notifications/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Notifications" }),
};

type Props = { params: Promise<Record<string, string>> };

export default async function NotificationsRoutePage(_props: Props) {
  return pickPortalVersion(
    () => <NotificationsPageV3 />,
    () => <NotificationsPage />,
  );
}
