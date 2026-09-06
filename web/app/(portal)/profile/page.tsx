import { generateMetaTitle } from "@/lib/generate-title";
import { ProfilePage } from "@/scenes/PortalV3/Profile/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Profile" }),
};

export default function Page() {
  return <ProfilePage />;
}
