import { useEffect, useState } from "react";
import { AppMetricsData, getAppMetricsData } from "../../server";

export const useGetMetrics = (appId: string, options?: { skip?: boolean }) => {
  const skip = options?.skip ?? false;
  const [metrics, setMetrics] = useState<AppMetricsData | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      const result = await getAppMetricsData(appId);
      if (!result.success) {
        console.error("Failed to fetch app metrics data: ", result.message);
        setError(result.error);
      } else {
        setMetrics(result.data as AppMetricsData);
      }
      setLoading(false);
    };

    fetchMetrics();
  }, [appId, skip]);

  return { metrics, loading, error };
};
