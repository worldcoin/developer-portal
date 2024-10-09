"use server";

import { type GetAppsResponse } from "@/api/v2/public/apps";

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

export const getAppRanking = async (appId: string) => {
  // TODO replace with arg appId
  const testAppId = "network";
  const apps = (await (
    await fetch(
      new URL(
        "/api/v2/public/apps",
        // TODO
        // process.env.NEXT_PUBLIC_APP_URL
        "https://world-id-assets.com/",
      ),
    )
  ).json()) as GetAppsResponse;

  const totalApps = apps.app_rankings.top_apps.length;

  if (apps.app_rankings.top_apps.length === 0) {
    throw new Error("No apps found");
  }

  const app = apps.app_rankings.top_apps.find(
    (app) => app.app_id === testAppId,
  );

  if (!app) {
    throw new Error(`App with id ${testAppId} not found`);
  }

  const appIndex = apps.app_rankings.top_apps.indexOf(app);
  const appRanking = `${appIndex + 1} / ${totalApps}`;

  return appRanking as `${number} / ${number}`;
};
