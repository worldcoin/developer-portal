"use server";

export type AppMetricsData = {
  impressions: number;
  impressions_7days: number;
  users: number;
  users_7days: number;
  unique_users: number;
  unique_users_7days: number;
};

export const getAppMetricsData = async (
  appId: string,
): Promise<AppMetricsData> => {
  // Fetch Metrics data
  const metricsData = await fetch(
    `${process.env.NEXT_PUBLIC_METRICS_SERVICE_ENDPOINT}/stats/data.json`,
    {
      headers: {
        "User-Agent": "DevPortal/1.0",
        "Content-Type": "application/json",
      },
    },
  );

  if (!metricsData.ok) {
    throw new Error(
      `Failed to fetch metrics data. Status: ${metricsData.status}.`,
    );
  }

  const metricsDataJson = await metricsData.json();
  const appMetrics = metricsDataJson.find(
    (metrics: any) => metrics.app_id === appId,
  );

  if (!appMetrics) {
    return {
      impressions: 0,
      impressions_7days: 0,
      users: 0,
      users_7days: 0,
      unique_users: 0,
      unique_users_7days: 0,
    };
  }

  return {
    impressions: appMetrics.total_impressions,
    impressions_7days: appMetrics.total_impressions_last_7_days,
    users: appMetrics.total_users,
    users_7days: appMetrics.total_users_last_7_days,
    unique_users: appMetrics.unique_users,
    unique_users_7days: appMetrics.unique_users_last_7_days,
  };
};
