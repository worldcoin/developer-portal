import { useEffect, useState } from "react";
import {
  AffiliateBalanceResponse,
  AffiliateMetadataResponse,
  AffiliateOverviewResponse,
} from "@/lib/types";
import { getAffiliateOverview } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/server/getAffiliateOverview";
import { getAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/server/getAffiliateMetadata";
import { getAffiliateBalance } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/server/getAffiliateBalance";

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
