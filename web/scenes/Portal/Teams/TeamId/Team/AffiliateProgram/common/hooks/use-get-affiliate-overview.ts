import { AffiliateOverviewResponse } from "@/lib/types";
import { getAffiliateOverview } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/server/getAffiliateOverview";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useGetAffiliateOverview = (params: {
  period: AffiliateOverviewResponse["result"]["period"];
}) => {
  const [data, setMetrics] = useState<
    AffiliateOverviewResponse["result"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getAffiliateOverview({ period: params.period });
      console.log("useGetAffiliateOverview data: ", result, result.data);
      if (!result.success) {
        console.error("Failed to fetch data: ", result.message);
        toast.error("Failed to fetch chart data. Please try later.");
        setError(result.error);
      } else {
        setMetrics((result.data as AffiliateOverviewResponse).result);
      }
      setLoading(false);
    };

    fetchData();
  }, [params?.period]);

  return { data, loading, error };
};
