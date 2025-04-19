import { useEffect, useState } from "react";
import {
  getAccumulativePaymentsData,
  GetAccumulativePaymentsDataReturnType,
  getAccumulativeTransactionsData,
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
      try {
        const paymentsData = await getAccumulativePaymentsData(appId);
        const transactionsData = await getAccumulativeTransactionsData(appId);
        setPayments(paymentsData);
        setTransactions(transactionsData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [appId]);

  return { payments, transactions, loading, error };
};
