import { generateMetaTitle } from "@/lib/genarate-title";
import { WithdrawPage } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Withdraw/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Withdraw" }),
};

export default WithdrawPage;
