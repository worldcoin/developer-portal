import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { ProfilePage } from "@/scenes/Portal/Profile/page";
import { ProfilePage as ProfilePageV3 } from "@/scenes/PortalV3/Profile/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Profile" }),
};

export default async function Page() {
  return pickPortalVersion(
    () => <ProfilePageV3 />,
    () => <ProfilePage />,
  );
}
