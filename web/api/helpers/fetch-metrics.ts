import { AppStatsReturnType, MetricsServiceAppData } from "@/lib/types";
import { fetchWithRetry } from "@/lib/utils";

interface ProcessedMetricsCache {
  byCountry: Map<string, AppStatsReturnType>;
  global: AppStatsReturnType;
  timestamp: number;
}

let memoryCache: ProcessedMetricsCache | null = null;
let pendingFetch: Promise<ProcessedMetricsCache | null> | null = null;

const MEMORY_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Fetch and process raw metrics data, caching results for all countries
 */
const fetchAndProcessMetrics =
  async (): Promise<ProcessedMetricsCache | null> => {
    const response = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_METRICS_SERVICE_ENDPOINT}/stats/data.json`,
      {
        headers: {
          "Cache-Control": "max-age=300", // 5 minutes, same as CloudFront
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
          uniqueUsersSum += user.value || 0;
        }
      }

      if (app.new_users_last_7_days) {
        for (const user of app.new_users_last_7_days) {
          if (user.country) countries.add(user.country.toUpperCase());
          newUsersSum += user.value || 0;
        }
      }

      if (app.total_users_last_7_days) {
        for (const user of app.total_users_last_7_days) {
          if (user.country) countries.add(user.country.toUpperCase());
          totalUsersSum += user.value || 0;
        }
      }

      return {
        ...app,
        unique_users_last_7_days: uniqueUsersSum || undefined,
        new_users_last_7_days: newUsersSum || undefined,
        total_users_last_7_days: totalUsersSum || undefined,
      };
    });

    // Process country-specific data
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

    return {
      byCountry,
      global,
      timestamp: Date.now(),
    };
  };

/**
 * Fetch metrics from the metrics service with in-memory caching and request deduplication.
 *
 * This function processes metrics data once and caches it for all countries.
 * Multiple concurrent requests share the same fetch operation to avoid duplicate
 * downloads and processing.
 *
 * @param country - The country to fetch data for
 * @returns The metrics data with the country data if specified, otherwise sum all values
 */
export const fetchMetrics = async (
  country?: string | null,
): Promise<AppStatsReturnType> => {
  const now = Date.now();

  // Check in-memory cache first
  if (memoryCache) {
    const age = now - memoryCache.timestamp;
    if (age < MEMORY_CACHE_TTL) {
      return country
        ? memoryCache.byCountry.get(country.toUpperCase()) || []
        : memoryCache.global;
    }
  }

  // Cache is stale or doesn't exist, need to fetch fresh data
  // If there's already a pending fetch, await it (request deduplication)
  if (pendingFetch) {
    const result = await pendingFetch;
    if (!result) {
      console.error("Failed to fetch metrics data");
      return [];
    }
    return country
      ? result.byCountry.get(country.toUpperCase()) || []
      : result.global;
  }

  // No pending fetch, start a new one
  pendingFetch = (async () => {
    try {
      const result = await fetchAndProcessMetrics();
      if (result) {
        memoryCache = result;
      }
      return result;
    } finally {
      pendingFetch = null;
    }
  })();

  // Await the fetch and return the result
  const result = await pendingFetch;
  if (!result) {
    console.error("Failed to fetch metrics data");
    return [];
  }

  return country
    ? result.byCountry.get(country.toUpperCase()) || []
    : result.global;
};

/**
 * Clear metrics cache
 * Useful for invalidating the cache when app data changes
 */
export const clearMetricsCache = () => {
  memoryCache = null;
  console.log("Metrics cache cleared");
};
