import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { DangerZone } from "@/scenes/Portal/Profile/DangerZone/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default async function Page() {
  return pickPortalVersion(
    () => redirect(urls.profile()),
    () => <DangerZone />,
  );
}
