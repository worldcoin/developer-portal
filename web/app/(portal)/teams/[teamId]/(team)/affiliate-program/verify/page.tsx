import { generateMetaTitle } from "@/lib/genarate-title";
import { VerifyPage } from "scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Verify";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Verify" }),
};

export default VerifyPage;
