"use server";

export type AppMetricsData = {
  impressions: number | null;
  impressions_7days: number | null;
  users: number | null;
  users_7days: number | null;
  unique_users: number | null;
  unique_users_7days: number | null;
  new_users_last_7_days: number | null;
  appRanking: `${number} / ${number}` | "-- / --";
};

export const getAppMetricsData = async (
  appId: string,
): Promise<AppMetricsData> => {
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
      new_users_last_7_days: 0,
      appRanking: "-- / --",
    };
  }

  const totalApps = metricsDataJson.length;
  const appIndex = metricsDataJson.indexOf(appMetrics);
  const appRanking = `${appIndex + 1} / ${totalApps}` as const;

  return {
    impressions: appMetrics.total_impressions,
    impressions_7days: appMetrics.total_impressions_last_7_days,
    users: appMetrics.total_users,
    users_7days: appMetrics.total_users_last_7_days,
    unique_users: appMetrics.unique_users,
    unique_users_7days: appMetrics.unique_users_last_7_days,
    new_users_last_7_days: appMetrics.new_users_last_7_days,
    appRanking,
  };
};
