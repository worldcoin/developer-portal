import { TransactionsTable } from "./TransactionsTable";
import { getTransactionData } from "./server";

type TransactionsPageProps = {
  params: Record<string, string> | null | undefined;
};

export const TransactionsPage = async (props: TransactionsPageProps) => {
  const { params } = props;
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;

  const transactionData = await getTransactionData(appId);
  console.log(transactionData);
  return (
    <div>
      <TransactionsTable transactionData={transactionData} />
    </div>
  );
};
