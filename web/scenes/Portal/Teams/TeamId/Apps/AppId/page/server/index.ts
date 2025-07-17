"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { DataByCountry } from "@/lib/types";

export type AppMetricsData = {
  total_impressions: number | null;
  total_impressions_last_7_days: number | null;
  total_users: number | null;
  total_users_last_7_days: number | null;
  unique_users: number | null;
  unique_users_last_7_days: number | null;
  new_users_last_7_days: number | null;
  appRanking: `${number} / ${number}` | "-- / --";
  open_rate_last_14_days: NotificationData[];
  notification_opt_in_rate: number | null;
};

type MetricsServiceAppData = {
  last_updated_at: string | null;
  total_impressions: number | null;
  total_impressions_last_7_days: number | null;
  total_users: DataByCountry[] | null;
  total_users_last_7_days: number | null;
  unique_users: number | null;
  unique_users_last_7_days: DataByCountry[] | null;
  new_users_last_7_days: DataByCountry[] | null;
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
  const appMetrics: MetricsServiceAppData = metricsDataJson.find(
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
      open_rate_last_14_days: [],
      notification_opt_in_rate: 0,
    };
  }

  const totalApps = metricsDataJson.length;
  const appIndex = metricsDataJson.indexOf(appMetrics);
  const appRanking = `${appIndex + 1} / ${totalApps}` as const;

  // For now we just sum all the countries and don't do anything by country
  return {
    total_impressions: appMetrics.total_impressions,
    total_impressions_last_7_days: appMetrics.total_impressions_last_7_days,
    total_users:
      appMetrics.total_users?.reduce(
        (acc, curr) => acc + Number(curr.value),
        0,
      ) || null,
    total_users_last_7_days: appMetrics.total_users_last_7_days,
    unique_users: appMetrics.unique_users,
    unique_users_last_7_days:
      appMetrics.unique_users_last_7_days?.reduce(
        (acc, curr) => acc + Number(curr.value),
        0,
      ) || null,
    new_users_last_7_days:
      appMetrics.new_users_last_7_days?.reduce(
        (acc, curr) => acc + Number(curr.value),
        0,
      ) || null,
    appRanking,
    open_rate_last_14_days: appMetrics.open_rate_last_14_days,
    notification_opt_in_rate: appMetrics.notification_opt_in_rate,
  };
};
