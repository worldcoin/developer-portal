import { generateMetaTitle } from "@/lib/generate-title";
import { DashboardPage } from "@/scenes/PortalV3/Dashboard/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Dashboard" }),
};

export default function Page() {
  return DashboardPage();
}
