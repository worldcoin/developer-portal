import { generateMetaTitle } from "@/lib/genarate-title";
import { EarningsPage } from "scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/page";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: generateMetaTitle({ left: "Earnings" }),
};

export default EarningsPage;
