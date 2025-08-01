import { useEffect, useState } from "react";
import {
  getAccumulativePaymentsData,
  GetAccumulativePaymentsDataReturnType,
  GetAccumulativeTransactionsDataReturnType,
} from "../../../Transactions/page/server/getAccumulativeTransactionData";

export const useGetAccumulativeTransactions = (appId: string) => {
  const [payments, setPayments] =
    useState<GetAccumulativePaymentsDataReturnType | null>(null);
  const [transactions, setTransactions] =
    useState<GetAccumulativeTransactionsDataReturnType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
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
  }, [appId]);

  return { payments, transactions, loading, error };
};
