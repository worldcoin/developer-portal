import { useEffect, useState } from "react";
import { AffiliateOverviewResponse } from "@/lib/types";
import { getAffiliateOverview } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/server/getAffiliateOverview";

export const useGetAffiliateOverview = () => {
  const [data, setMetrics] = useState<AffiliateOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getAffiliateOverview();
      if (!result.success) {
        console.error("Failed to fetch data: ", result.message);
        setError(result.error);
      } else {
        setMetrics(result.data as AffiliateOverviewResponse);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
