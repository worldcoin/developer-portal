import { generateMetaTitle } from "@/lib/genarate-title";
import { ProfilePage as ProfilePageV3 } from "@/scenes/PortalV3/Profile/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Profile" }),
};

export default async function Page() {
  return <ProfilePageV3 />;
}
