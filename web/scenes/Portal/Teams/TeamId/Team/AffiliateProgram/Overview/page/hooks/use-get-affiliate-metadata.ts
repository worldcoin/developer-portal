import { useEffect, useState } from "react";
import { AffiliateMetadataResponse } from "@/lib/types";
import { getAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/server/getAffiliateMetadata";

export const useGetAffiliateMetadata = () => {
  const [data, setMetrics] = useState<AffiliateMetadataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getAffiliateMetadata();
      if (!result.success) {
        console.error("Failed to fetch data: ", result.message);
        setError(result.error);
      } else {
        setMetrics(result.data as AffiliateMetadataResponse);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
