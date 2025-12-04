import { AffiliateMetadataResponse } from "@/lib/types";
import { getAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/server/getAffiliateMetadata";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useGetAffiliateMetadata = (options?: { skip?: boolean }) => {
  const [data, setData] = useState<AffiliateMetadataResponse["result"] | null>(
    null,
  );
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    // Skip fetching if skip is true
    if (options?.skip) {
      setLoading(false);
      return;
    }

    // Set loading to true before starting the fetch
    setLoading(true);
    setError(null); // Clear previous errors

    const fetchData = async () => {
      const result = await getAffiliateMetadata();
      console.log("useGetAffiliateMetadata data: ", result, result.data);
      if (!result.success) {
        console.error("Failed to fetch data: ", result.message);
        toast.error("Failed to fetch metadata. Please try later.");
        setError(result.error);
      } else {
        setData((result.data as AffiliateMetadataResponse).result);
      }
      setLoading(false);
    };

    fetchData();
  }, [options?.skip]);

  return { data, loading, error };
};
