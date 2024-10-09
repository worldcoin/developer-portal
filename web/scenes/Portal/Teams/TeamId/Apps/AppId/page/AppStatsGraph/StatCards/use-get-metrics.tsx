import { useEffect, useState } from "react";
import { AppMetricsData, getAppMetricsData } from "../../server";

export const useGetMetrics = (appId: string) => {
  const [metrics, setMetrics] = useState<AppMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getAppMetricsData(appId);
        setMetrics(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { metrics, loading, error };
};
