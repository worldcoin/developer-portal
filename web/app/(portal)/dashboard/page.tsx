import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { DashboardPage } from "@/scenes/PortalV3/Dashboard/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Dashboard" }),
};

export default function Page() {
  return pickPortalVersion(
    () => DashboardPage(),
    () => redirect(urls.teams({})),
  );
}
