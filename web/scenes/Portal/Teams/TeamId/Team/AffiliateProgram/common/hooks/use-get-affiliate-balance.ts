import { useEffect, useState } from "react";
import { AffiliateBalanceResponse } from "@/lib/types";
import { getAffiliateBalance } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/server/getAffiliateBalance";
import { toast } from "react-toastify";

export const useGetAffiliateBalance = () => {
  const [data, setMetrics] = useState<
    AffiliateBalanceResponse["result"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getAffiliateBalance();
      console.log("useGetAffiliateBalance data: ", result, result.data);
      if (!result.success) {
        console.error("Failed to fetch data: ", result.message);
        toast.error("Failed to fetch balance. Please try later.");
        setError(result.error);
      } else {
        setMetrics((result.data as AffiliateBalanceResponse).result);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
