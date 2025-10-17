import { generateMetaTitle } from "@/lib/genarate-title";
import { HowItWorksPage } from "scenes/Portal/Teams/TeamId/Team/AffiliateProgram/HowItWorks/page";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: generateMetaTitle({ left: "How it works" }),
};

export default HowItWorksPage;
