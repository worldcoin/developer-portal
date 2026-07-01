import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { TransactionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page";
import { TransactionsPage as TransactionsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Transactions" }),
};

type Props = { params: Promise<Record<string, string>> };

export default async function TransactionsRoutePage(props: Props) {
  const params = await props.params;
  return pickPortalVersion(
    () => <TransactionsPageV3 params={params} />,
    () => <TransactionsPage params={params} />,
  );
}
