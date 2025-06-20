/**
 *
 * This job is designed to run once a week.
 * Changing the interval will most importantly result
 * in a change to the notification permission pause
 * duration.
 *
 */

import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { AppStatsItem, AppStatsReturnType } from "@/lib/types";
import { fetchWithRetry } from "@/lib/utils";
import { differenceInDays, differenceInMinutes } from "date-fns";
import { GraphQLClient } from "graphql-request";
import { NextRequest, NextResponse } from "next/server";
import { getAPIServiceGraphqlClient } from "../helpers/graphql";
import {
  getSdk as getGetNotificationEvaluationAppsSdk,
  GetNotificationEvaluationAppsQuery,
} from "./graphql/get-notification-evaluation-apps.generated";
import { getSdk as getUpdateNotificationPermissionStatusSdk } from "./graphql/update-notification-permission-status.generated";

type NotificationState = "normal" | "paused" | "enabled_after_pause";

export type InternalNotificationPermissionShouldUpdateResult = {
  should_update_state: true;
  new_state: NotificationState;
  new_state_changed_date: Date;
};
export type InternalNotificationPermissionShouldNotUpdateResult = {
  should_update_state: false;
};

type InternalNotificationPermissionResult =
  | InternalNotificationPermissionShouldUpdateResult
  | InternalNotificationPermissionShouldNotUpdateResult;

const NOTIFICATION_OPEN_RATE_THRESHOLD = 0.1;
const ONE_WEEK_IN_DAYS = 7;
const ONE_WEEK_IN_MINUTES = ONE_WEEK_IN_DAYS * 24 * 60;
const TIMING_LEEWAY_MINUTES = 5;

const calculateLast7DaysOpenRate = (
  appStats: AppStatsItem,
  now: Date,
): number | null => {
  if (!appStats.open_rate_last_14_days) {
    return null;
  }

  const relevantTimeseries =
    appStats.open_rate_last_14_days.filter(
      (el) => differenceInDays(now, new Date(el.date)) <= ONE_WEEK_IN_DAYS,
    ) ?? [];

  if (relevantTimeseries.length === 0) {
    return null;
  }

  return (
    relevantTimeseries.reduce((acc, el) => acc + el.value, 0) /
    relevantTimeseries.length
  );
};

const skipStateUpdate = {
  should_update_state: false,
} as const;

export const evaluateNotificationPermissions = (
  appMetadata: GetNotificationEvaluationAppsQuery["app_metadata"][number],
  appStats: AppStatsItem,
): InternalNotificationPermissionResult => {
  // if unlimited notifications are already allowed, skip evaluation
  if (appMetadata.is_allowed_unlimited_notifications) {
    return skipStateUpdate;
  }
  const notificationState =
    (appMetadata.notification_permission_status as NotificationState) ||
    "normal";
  const stateChangedDate =
    appMetadata.notification_permission_status_changed_date
      ? new Date(appMetadata.notification_permission_status_changed_date)
      : null;
  const now = new Date();

  const minutesSinceStateChange = stateChangedDate
    ? differenceInMinutes(now, stateChangedDate)
    : Infinity;

  // check if we're within the 5-minute window around one week, or if no date is set (null = infinite time)
  const hasOneWeekPassed =
    stateChangedDate === null ||
    Math.abs(minutesSinceStateChange - ONE_WEEK_IN_MINUTES) <=
      TIMING_LEEWAY_MINUTES;

  // calculate weekly open rate
  const weeklyOpenRate = calculateLast7DaysOpenRate(appStats, now);

  // if equal to 0, most likely testing leftovers
  const isUnderOpenRateThreshold =
    weeklyOpenRate !== null &&
    weeklyOpenRate !== 0 &&
    weeklyOpenRate < NOTIFICATION_OPEN_RATE_THRESHOLD;

  switch (notificationState) {
    case "normal": {
      // if open rate < 10%, pause notifications
      if (isUnderOpenRateThreshold) {
        return {
          should_update_state: true,
          new_state: "paused",
          new_state_changed_date: now,
        };
      }

      // open rate is good, continue normal operation
      return skipStateUpdate;
    }

    case "paused": {
      // stay paused for 1 week
      if (!hasOneWeekPassed) {
        return skipStateUpdate;
      }

      // after 1 week, enable notifications and move to enabled_after_pause state
      return {
        should_update_state: true,
        new_state: "enabled_after_pause",
        new_state_changed_date: now,
      };
    }

    case "enabled_after_pause": {
      // evaluate after 1 week of being enabled
      if (!hasOneWeekPassed) {
        return skipStateUpdate;
      }

      // if open rate still < 10%, pause again
      if (isUnderOpenRateThreshold) {
        return {
          should_update_state: true,
          new_state: "paused",
          new_state_changed_date: now,
        };
      }

      // if no data or open rate >= 10%, return to normal operation
      return {
        should_update_state: true,
        new_state: "normal",
        new_state_changed_date: now,
      };
    }

    default: {
      logger.error(
        "_evaluate-app-notification-permissions - unknown notification state",
        {
          appId: appMetadata.app_id,
          state: notificationState,
        },
      );
      return skipStateUpdate;
    }
  }
};

export const safeUpdateNotificationState = async (
  app_id: string,
  client: GraphQLClient,
  updates: {
    notification_permission_status: NotificationState;
    notification_permission_status_changed_date: Date;
  },
): Promise<void> => {
  try {
    const sdk = getUpdateNotificationPermissionStatusSdk(client);

    await sdk.UpdateNotificationPermissionStatus({
      app_id: app_id,
      notification_permission_status: updates.notification_permission_status,
      notification_permission_status_changed_date:
        updates.notification_permission_status_changed_date?.toISOString(),
    });

    logger.info(
      "_evaluate-app-notification-permissions - notification state updated successfully",
      {
        app_id,
        updates,
      },
    );
  } catch (error) {
    logger.error(
      "_evaluate-app-notification-permissions - failed to update notification state",
      {
        app_id,
        updates,
        error,
      },
    );
  }
};

const fetchMetrics = async (): Promise<AppStatsReturnType> => {
  const response = await fetchWithRetry(
    `${process.env.NEXT_PUBLIC_METRICS_SERVICE_ENDPOINT}/stats/data.json`,
    {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
    3,
    400,
    false,
  );

  let metricsData: AppStatsReturnType = [];

  if (response.status == 200) {
    metricsData = await response.json();
  }
  return metricsData;
};

/** This is designed to run once a week
 *
 * Limits the number of processed records, by getting only verified apps,
 * and from this subset, only apps that have open rate data
 *
 */
export const POST = async (req: NextRequest) => {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  logger.info("_evaluate-app-notification-permissions - starting");

  const metricsData = await fetchMetrics();

  const appIdsToEvaluate = metricsData
    .filter((app) => (app.open_rate_last_14_days?.length ?? 0) > 0)
    .map((app) => app.app_id);

  if (appIdsToEvaluate.length > 600) {
    logger.warn(
      "_evaluate-app-notification-permissions - notification permission list is getting too long",
      {
        listLength: appIdsToEvaluate.length,
      },
    );
  }

  if (appIdsToEvaluate.length === 0) {
    logger.info("_evaluate-app-notification-permissions - no apps to evaluate");
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const client = await getAPIServiceGraphqlClient();
  const sdk = getGetNotificationEvaluationAppsSdk(client);

  const appMetadata = await sdk.GetNotificationEvaluationApps({
    appIds: appIdsToEvaluate,
  });

  const appsToEvaluate = appMetadata.app_metadata.map((app) => ({
    app_id: app.app_id,
    notification_permission_status: app.notification_permission_status,
    notification_permission_status_changed_date:
      app.notification_permission_status_changed_date,
  }));

  logger.info("_evaluate-app-notification-permissions - apps to evaluate", {
    numberOfAppsToEvaluate: appsToEvaluate.length,
  });

  for (const app of appsToEvaluate) {
    const appStats = metricsData.find((metric) => metric.app_id === app.app_id);
    if (!appStats) {
      logger.error(
        "_evaluate-app-notification-permissions - app stats not found",
        {
          app_id: app.app_id,
        },
      );

      continue;
    }

    const evaluationResult = evaluateNotificationPermissions(app, appStats);

    if (evaluationResult.should_update_state) {
      void safeUpdateNotificationState(app.app_id, client, {
        notification_permission_status: evaluationResult.new_state,
        notification_permission_status_changed_date:
          evaluationResult.new_state_changed_date,
      });
    }
    continue;
  }

  logger.info("_evaluate-app-notification-permissions - finished execution");

  return NextResponse.json(
    {
      success: true,
    },
    { status: 200 },
  );
};
