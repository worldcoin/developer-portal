import { generateMetaTitle } from "@/lib/genarate-title";
import { JoinPage } from "@/scenes/Onboarding/Join/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Join" }),
};

export default JoinPage;
