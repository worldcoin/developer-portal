import { generateMetaTitle } from "@/lib/genarate-title";
import { TransactionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Transactions/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Mini App Transactions" }),
};

export default TransactionsPage;
