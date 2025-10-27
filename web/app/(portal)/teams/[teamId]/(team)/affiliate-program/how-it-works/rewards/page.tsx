import { generateMetaTitle } from "@/lib/genarate-title";
import { RewardsPage } from "scenes/Portal/Teams/TeamId/Team/AffiliateProgram/HowItWorks/CountryRewards";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Rewards" }),
};

export default RewardsPage;
