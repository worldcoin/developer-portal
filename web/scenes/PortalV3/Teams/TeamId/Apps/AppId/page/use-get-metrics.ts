"use client";

import { useEffect, useState } from "react";
import { getAppMetricsData, type AppMetricsData } from "./server";

export const useGetMetrics = (appId: string) => {
  const [metrics, setMetrics] = useState<AppMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    setMetrics(null);
    setLoading(true);
    setError(false);

    getAppMetricsData(appId)
      .then((result) => {
        if (!active) return;

        if (!result.success || !result.data) {
          console.error("Failed to fetch app metrics data: ", result.message);
          setError(true);
          return;
        }

        setMetrics(result.data as AppMetricsData);
      })
      .catch((fetchError: unknown) => {
        if (!active) return;
        console.error("Failed to fetch app metrics data: ", fetchError);
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appId]);

  return { metrics, loading, error };
};
