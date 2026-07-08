import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminAppsPage } from "@/scenes/Admin/apps/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Apps" }),
};

export default AdminAppsPage;
