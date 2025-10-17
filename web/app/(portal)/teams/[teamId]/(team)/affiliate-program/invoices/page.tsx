import { generateMetaTitle } from "@/lib/genarate-title";
import { InvoicesPage } from "scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Invoices/page";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: generateMetaTitle({ left: "Invoices" }),
};

export default InvoicesPage;
