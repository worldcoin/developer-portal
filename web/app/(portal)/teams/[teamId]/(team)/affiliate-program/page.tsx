import { generateMetaTitle } from "@/lib/genarate-title";
import { AffiliateProgramPage } from "scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Affiliate program" }),
};

export default AffiliateProgramPage;
