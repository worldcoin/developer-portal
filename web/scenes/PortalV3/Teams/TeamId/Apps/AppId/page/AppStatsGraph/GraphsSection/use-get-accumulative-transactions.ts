import { useEffect, useState } from "react";
import {
  getAccumulativePaymentsData,
  GetAccumulativePaymentsDataReturnType,
  GetAccumulativeTransactionsDataReturnType,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page/server/getAccumulativeTransactionData";

export const useGetAccumulativeTransactions = (
  appId: string,
  options?: { skip?: boolean },
) => {
  const skip = options?.skip ?? false;
  const [payments, setPayments] =
    useState<GetAccumulativePaymentsDataReturnType | null>(null);
  const [transactions, setTransactions] =
    useState<GetAccumulativeTransactionsDataReturnType | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      const result = await getAccumulativePaymentsData(appId);
      if (!result.success) {
        setError(result.message);
        console.error("Failed to fetch payments data: ", result.message);
      } else {
        setPayments(result.data as GetAccumulativePaymentsDataReturnType);
      }
      // TODO once we have metrics endpoint
      // const transactionsData = await getAccumulativeTransactionsData(appId);
      // setTransactions(transactionsData);
      setLoading(false);
    };

    fetchTransactions();
  }, [appId, skip]);

  return { payments, transactions, loading, error };
};
