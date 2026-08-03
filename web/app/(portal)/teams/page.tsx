import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { TeamsPage } from "@/scenes/Portal/Teams/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Teams" }),
};

export default function Page() {
  return pickPortalVersion(
    () => redirect(urls.dashboard()),
    () => TeamsPage(),
  );
}
