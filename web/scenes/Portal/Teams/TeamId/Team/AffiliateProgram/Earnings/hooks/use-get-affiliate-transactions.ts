import { AffiliateTransactionsResponse } from "@/lib/types";
import { useEffect, useState } from "react";
import { getAffiliateTransactions } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Earnings/server/getAffiliateTransactions";

export const useGetAffiliateTransactions = (params?: {
  period?: "day" | "week" | "month" | "year";
}) => {
  const [data, setMetrics] = useState<AffiliateTransactionsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getAffiliateTransactions({ period: params?.period });
      if (!result.success) {
        console.error("Failed to fetch data: ", result.message);
        setError(result.error);
      } else {
        setMetrics(result.data as AffiliateTransactionsResponse);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
