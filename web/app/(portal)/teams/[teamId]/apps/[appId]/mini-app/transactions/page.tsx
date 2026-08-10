import { generateMetaTitle } from "@/lib/genarate-title";
import { TransactionsPage as TransactionsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Transactions" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  const params = await props.params;
  return <TransactionsPageV3 params={params} />;
}
