import { generateMetaTitle } from "@/lib/genarate-title";
import { DashboardPage } from "@/scenes/PortalV3/Dashboard/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Dashboard" }),
};

export default function Page() {
  return DashboardPage();
}
