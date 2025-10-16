import { useEffect, useState } from "react";
import {
  AppMetricsData,
  getAppMetricsData,
} from "@/scenes/Portal/Teams/TeamId/Apps/AppId/page/server";

export const useGetMetrics = (appId: string) => {
  const [metrics, setMetrics] = useState<AppMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
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
  }, [appId]);

  return { metrics, loading, error };
};
