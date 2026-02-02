"use client";

import { useEffect, useState } from "react";

const USE_MOCK_DATA = false;

const mockWeeklyMetrics: MetricsWithChange = {
  impressions: 24853,
  impressionsChange: 12.4,
  sessions: 18234,
  sessionsChange: 8.2,
  users: 6847,
  usersChange: -3.1,
  newUsers: 1249,
  newUsersChange: 22.7,
};

const mockAllTimeMetrics: MetricsWithChange = {
  impressions: 142580,
  impressionsChange: null,
  sessions: 98432,
  sessionsChange: null,
  users: 34219,
  usersChange: null,
  newUsers: 34219,
  newUsersChange: null,
};

interface CachedMetrics {
  impressions: number | null;
  sessions: number | null;
  users: number | null;
  newUsers: number | null;
  cachedAt: string; // ISO date string
}

interface MetricsWithChange {
  impressions: number | null;
  impressionsChange: number | null;
  sessions: number | null;
  sessionsChange: number | null;
  users: number | null;
  usersChange: number | null;
  newUsers: number | null;
  newUsersChange: number | null;
}

const CACHE_KEY_PREFIX = "dashboard_metrics_";
const CACHE_DURATION_DAYS = 7;

const getCacheKey = (appId: string) => `${CACHE_KEY_PREFIX}${appId}`;

const isOlderThanOneWeek = (cachedAt: string): boolean => {
  const cachedDate = new Date(cachedAt);
  const now = new Date();
  const diffInDays =
    (now.getTime() - cachedDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffInDays >= CACHE_DURATION_DAYS;
};

const calculatePercentChange = (
  current: number | null,
  previous: number | null
): number | null => {
  if (current === null || previous === null || previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
};

export const useCachedMetrics = (
  appId: string,
  currentMetrics: {
    impressions: number | null;
    sessions: number | null;
    users: number | null;
    newUsers: number | null;
  } | null,
  isLoading: boolean,
  timePeriod: "weekly" | "all-time" = "weekly"
): MetricsWithChange => {
  const [metricsWithChange, setMetricsWithChange] = useState<MetricsWithChange>(
    {
      impressions: null,
      impressionsChange: null,
      sessions: null,
      sessionsChange: null,
      users: null,
      usersChange: null,
      newUsers: null,
      newUsersChange: null,
    }
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Always use mock data when enabled for preview
    if (USE_MOCK_DATA) {
      setMetricsWithChange(timePeriod === "weekly" ? mockWeeklyMetrics : mockAllTimeMetrics);
      return;
    }

    // Use real data
    if (!currentMetrics || (currentMetrics.impressions === null && currentMetrics.sessions === null)) {
      return;
    }

    const cacheKey = getCacheKey(appId);

    // Try to get cached data
    let cachedData: CachedMetrics | null = null;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        cachedData = JSON.parse(cached) as CachedMetrics;
      }
    } catch {
      // Ignore localStorage errors
    }

    // Calculate changes if we have valid cached data from a previous week
    let impressionsChange: number | null = null;
    let sessionsChange: number | null = null;
    let usersChange: number | null = null;
    let newUsersChange: number | null = null;

    if (cachedData && isOlderThanOneWeek(cachedData.cachedAt)) {
      impressionsChange = calculatePercentChange(
        currentMetrics.impressions,
        cachedData.impressions
      );
      sessionsChange = calculatePercentChange(
        currentMetrics.sessions,
        cachedData.sessions
      );
      usersChange = calculatePercentChange(
        currentMetrics.users,
        cachedData.users
      );
      newUsersChange = calculatePercentChange(
        currentMetrics.newUsers,
        cachedData.newUsers
      );

      // Update cache with new data since a week has passed
      try {
        const newCache: CachedMetrics = {
          impressions: currentMetrics.impressions,
          sessions: currentMetrics.sessions,
          users: currentMetrics.users,
          newUsers: currentMetrics.newUsers,
          cachedAt: new Date().toISOString(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(newCache));
      } catch {
        // Ignore localStorage errors
      }
    } else if (!cachedData) {
      // No cached data, save current data for future comparison
      try {
        const newCache: CachedMetrics = {
          impressions: currentMetrics.impressions,
          sessions: currentMetrics.sessions,
          users: currentMetrics.users,
          newUsers: currentMetrics.newUsers,
          cachedAt: new Date().toISOString(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(newCache));
      } catch {
        // Ignore localStorage errors
      }
    }
    // If cachedData exists but is less than a week old, we don't update and don't show change

    setMetricsWithChange({
      impressions: currentMetrics.impressions,
      impressionsChange,
      sessions: currentMetrics.sessions,
      sessionsChange,
      users: currentMetrics.users,
      usersChange,
      newUsers: currentMetrics.newUsers,
      newUsersChange,
    });
  }, [appId, currentMetrics, isLoading, timePeriod]);

  return metricsWithChange;
};
