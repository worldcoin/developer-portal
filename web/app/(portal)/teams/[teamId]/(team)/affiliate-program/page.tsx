import { generateMetaTitle } from "@/lib/genarate-title";
import { AffiliateProgramPage } from "scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "World Grow (affiliate)" }),
};

export default AffiliateProgramPage;
