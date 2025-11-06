import { useEffect, useState } from "react";
import { AffiliateMetadataResponse } from "@/lib/types";
import { getAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/server/getAffiliateMetadata";

export const useGetAffiliateMetadata = () => {
  const [data, setData] = useState<AffiliateMetadataResponse["result"] | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await getAffiliateMetadata();
      console.log("useGetAffiliateMetadata data: ", result, result.data);
      if (!result.success) {
        console.error("Failed to fetch data: ", result.message);
        setError(result.error);
      } else {
        setData((result.data as AffiliateMetadataResponse).result);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
