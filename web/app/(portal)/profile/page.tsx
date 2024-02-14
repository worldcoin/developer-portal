import { generateMetaTitle } from "@/lib/genarate-title";
import { ProfilePage } from "@/scenes/Portal/Profile/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "User profile" }),
};

export default ProfilePage;
