import { generateMetaTitle } from "@/lib/generate-title";
import { JoinPage } from "@/scenes/Onboarding/Join/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Join" }),
};

export default JoinPage;
