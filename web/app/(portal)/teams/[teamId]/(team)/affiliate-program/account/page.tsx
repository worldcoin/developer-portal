import { generateMetaTitle } from "@/lib/genarate-title";
import { AffiliateAccountPage } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Account/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Account" }),
};

export default AffiliateAccountPage;
