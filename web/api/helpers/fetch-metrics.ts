import { AppStatsReturnType, MetricsServiceAppData } from "@/lib/types";
import { fetchWithRetry } from "@/lib/utils";

interface ProcessedMetricsCache {
  byCountry: Map<string, AppStatsReturnType>;
  global: AppStatsReturnType;
  timestamp: number;
}

let pendingFetch: Promise<void> | null = null;

const redis = global.RedisClient;
const REDIS_CACHE_KEY = "metrics_processed_cache";

/**
 * Fetch and process raw metrics data, caching results for all countries
 */
const fetchAndProcessMetrics = async (): Promise<void> => {
  const response = await fetchWithRetry(
    `${process.env.NEXT_PUBLIC_METRICS_SERVICE_ENDPOINT}/stats/data.json`,
    {
      headers: {
        "Cache-Control": "max-age=600", // 10 minutes, since metrics only updates every few hours
      },
    },
    3,
    400,
    false,
  );

  if (response.status !== 200) {
    console.error("Failed to fetch metrics", {
      status: response.status,
      statusText: response.statusText,
    });
    throw new Error("Failed to fetch metrics");
  }

  if (!redis) {
    console.error("Redis client not available");
    return;
  }

  const rawData: MetricsServiceAppData[] = await response.json();

  const byCountry = new Map<string, AppStatsReturnType>();
  const countries = new Set<string>();

  const global = rawData.map((app) => {
    let uniqueUsersSum = 0;
    let newUsersSum = 0;
    let totalUsersSum = 0;

    if (app.unique_users_last_7_days) {
      for (const user of app.unique_users_last_7_days) {
        if (user.country) countries.add(user.country.toUpperCase());
        uniqueUsersSum += Number(user.value) || 0;
      }
    }

    if (app.new_users_last_7_days) {
      for (const user of app.new_users_last_7_days) {
        if (user.country) countries.add(user.country.toUpperCase());
        newUsersSum += Number(user.value) || 0;
      }
    }

    if (app.total_users_last_7_days) {
      for (const user of app.total_users_last_7_days) {
        if (user.country) countries.add(user.country.toUpperCase());
        totalUsersSum += Number(user.value) || 0;
      }
    }

    return {
      ...app,
      unique_users_last_7_days: uniqueUsersSum || undefined,
      new_users_last_7_days: newUsersSum || undefined,
      total_users_last_7_days: totalUsersSum || undefined,
    };
  });

  // Process country-specific data in a single pass per country
  for (const country of countries) {
    const countryData = rawData.map((app) => {
      let uniqueUsers: number | undefined;
      let newUsers: number | undefined;
      let totalUsers: number | undefined;

      if (app.unique_users_last_7_days) {
        uniqueUsers = app.unique_users_last_7_days.find(
          (user) => user.country?.toUpperCase() === country,
        )?.value;
      }

      if (app.new_users_last_7_days) {
        newUsers = app.new_users_last_7_days.find(
          (user) => user.country?.toUpperCase() === country,
        )?.value;
      }

      if (app.total_users_last_7_days) {
        totalUsers = app.total_users_last_7_days.find(
          (user) => user.country?.toUpperCase() === country,
        )?.value;
      }

      return {
        ...app,
        unique_users_last_7_days: uniqueUsers,
        new_users_last_7_days: newUsers,
        total_users_last_7_days: totalUsers,
      };
    });

    byCountry.set(country, countryData);
  }

  // Cache the processed data
  await redis.setex(
    REDIS_CACHE_KEY,
    72 * 60 * 60, // 72 hours, since metrics only updates every few hours and we should refresh this every 24 hours anyways
    JSON.stringify({
      byCountry,
      global,
      timestamp: Date.now(),
    }),
  );
};

/**
 * Fetch metrics from the metrics service with 10-minute caching for all countries.
 * While fetching, we return the stalecached data.
 *
 * This function processes metrics data once and caches it for all countries.
 * Subsequent requests for any country or global data use the cached processed data.
 *
 * @param expirationTime - Not used anymore, kept for API compatibility
 * @param country - The country to fetch data for
 * @returns The metrics data with the country data if specified, otherwise sum all values
 */
export const fetchMetrics = async (
  country?: string | null,
): Promise<AppStatsReturnType> => {
  const now = Date.now();
  const THIRTY_MINUTES_IN_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

  if (!redis) {
    console.error("Redis client not available");
    return [];
  }

  const cached = await redis.get(REDIS_CACHE_KEY);
  let processedCache: ProcessedMetricsCache | null = null;

  if (cached) {
    processedCache = JSON.parse(cached) as ProcessedMetricsCache;
  }

  // Check if we have fresh cached data
  if (processedCache) {
    const age = now - processedCache.timestamp;
    if (age < THIRTY_MINUTES_IN_MS) {
      return country
        ? processedCache.byCountry.get(country.toUpperCase()) || []
        : processedCache.global;
    }
  }

  // Cache is stale or doesn't exist, or there's already a fetch in progress
  if (pendingFetch) {
    // There's already a fetch in progress, return the stale data
    if (processedCache) {
      return country
        ? processedCache.byCountry.get(country.toUpperCase()) || []
        : processedCache.global;
    } else {
      await pendingFetch;
      return country
        ? processedCache!.byCountry.get(country.toUpperCase()) || []
        : processedCache!.global;
    }
  }

  // No pending fetch, start a new one
  pendingFetch = (async () => {
    try {
      await fetchAndProcessMetrics();
    } finally {
      pendingFetch = null;
    }
  })();

  // This situation is called if we don't have a pending fetch, but have stale data and we should start a new fetch
  if (processedCache) {
    pendingFetch.catch((error) => {
      console.error("Error fetching metrics", { error });
    });
    return country
      ? processedCache.byCountry.get(country.toUpperCase()) || []
      : processedCache.global;
  } else {
    await pendingFetch;
    return country
      ? processedCache!.byCountry.get(country.toUpperCase()) || []
      : processedCache!.global;
  }
};
