import { generateMetaTitle } from "@/lib/genarate-title";
import { TransactionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Transactions" }),
};

// Next 16: params is a Promise — resolve it before handing it to the scene component.
export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  return <TransactionsPage params={await props.params} />;
}
