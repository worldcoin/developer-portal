import { generateMetaTitle } from "@/lib/genarate-title";
import { DangerZone } from "@/scenes/Portal/Profile/DangerZone/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default DangerZone;
