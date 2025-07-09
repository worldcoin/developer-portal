"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";

export type AppMetricsData = {
  total_impressions: number | null;
  total_impressions_last_7_days: number | null;
  total_users: number | null;
  total_users_last_7_days: number | null;
  unique_users: number | null;
  unique_users_last_7_days: number | null;
  new_users_last_7_days: number | null;
  appRanking: `${number} / ${number}` | "-- / --";
  n_users_opened_last_14_days: NotificationData[] | null;
  n_users_received_last_14_days: NotificationData[] | null;
  open_rate_last_14_days: NotificationData[];
  notification_opt_in_rate: number | null;
};

type NotificationData = {
  date: string;
  value: number;
};

export const getAppMetricsData = async (
  appId: string,
): Promise<AppMetricsData> => {
  const path = getPathFromHeaders() || "";
  const { Teams: teamId } = extractIdsFromPath(path, ["Teams"]);

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
    errorFormAction({
      message: "getAppMetricsData - failed to fetch metrics data",
      additionalInfo: { status: metricsData.status },
      team_id: teamId,
      app_id: appId,
    });
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
      notification_opt_in_rate: 0,
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
    notification_opt_in_rate: appMetrics.notification_opt_in_rate,
  };
};
