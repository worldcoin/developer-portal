import { generateMetaTitle } from "@/lib/genarate-title";
import { AppPermissionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/MiniApp/Permissions/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Permissions" }),
};

export default AppPermissionsPage;
