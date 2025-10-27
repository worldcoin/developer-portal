import { useEffect, useState } from "react";
import { AffiliateBalanceResponse } from "@/lib/types";
import { getAffiliateBalance } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/server/getAffiliateBalance";

export const useGetAffiliateBalance = () => {
  const [data, setMetrics] = useState<AffiliateBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getAffiliateBalance();
      if (!result.success) {
        console.error("Failed to fetch data: ", result.message);
        setError(result.error);
      } else {
        setMetrics(result.data as AffiliateBalanceResponse);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
