import { useEffect, useState } from "react";
import {
  getAccumulativeTransactionData,
  GetAccumulativeTransactionDataReturnType,
} from "../../../Transactions/page/server/getAccumulativeTransactionData";

export const useGetAccumulativeTransactions = (appId: string) => {
  const [transactions, setTransactions] =
    useState<GetAccumulativeTransactionDataReturnType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await getAccumulativeTransactionData(appId);
        setTransactions(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [appId]);

  return { transactions, loading, error };
};
