"use server";

export type AppMetricsData = {
  total_impressions: number | null;
  total_impressions_last_7_days: number | null;
  total_users: number | null;
  total_users_last_7_days: number | null;
  unique_users: number | null;
  unique_users_last_7_days: number | null;
  new_users_last_7_days: number | null;
  appRanking: `${number} / ${number}` | "-- / --";
  n_users_opened_last_14_days: NotificationData[];
  n_users_received_last_14_days: NotificationData[];
  open_rate_last_14_days: NotificationData[];
};

type NotificationData = {
  date: string;
  value: number;
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
      total_impressions: 0,
      total_impressions_last_7_days: 0,
      total_users: 0,
      total_users_last_7_days: 0,
      unique_users: 0,
      unique_users_last_7_days: 0,
      new_users_last_7_days: 0,
      appRanking: "-- / --",
      n_users_opened_last_14_days: [],
      n_users_received_last_14_days: [],
      open_rate_last_14_days: [],
    };
  }

  const totalApps = metricsDataJson.length;
  const appIndex = metricsDataJson.indexOf(appMetrics);
  const appRanking = `${appIndex + 1} / ${totalApps}` as const;

  return {
    total_impressions: appMetrics.total_impressions,
    total_impressions_last_7_days: appMetrics.total_impressions_last_7_days,
    total_users: appMetrics.total_users,
    total_users_last_7_days: appMetrics.total_users_last_7_days,
    unique_users: appMetrics.unique_users,
    unique_users_last_7_days: appMetrics.unique_users_last_7_days,
    new_users_last_7_days: appMetrics.new_users_last_7_days,
    appRanking,
    n_users_opened_last_14_days: appMetrics.n_users_opened_last_14_days,
    n_users_received_last_14_days: appMetrics.n_users_received_last_14_days,
    open_rate_last_14_days: appMetrics.open_rate_last_14_days,
  };
};
