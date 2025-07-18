import { AppStatsReturnType, MetricsServiceAppData } from "@/lib/types";
import { fetchWithRetry } from "@/lib/utils";

interface ProcessedMetricsCache {
  byCountry: Map<string, AppStatsReturnType>;
  global: AppStatsReturnType;
  timestamp: number;
}

interface RedisMetricsCache {
  byCountry: Record<string, AppStatsReturnType>; // Use Record for Redis JSON serialization
  global: AppStatsReturnType;
  timestamp: number;
}

let memoryCache: ProcessedMetricsCache | null = null;
let pendingFetch: Promise<ProcessedMetricsCache | null> | null = null;

const redis = global.RedisClient;
const REDIS_CACHE_KEY = "metrics_processed_cache";
const MEMORY_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch and process raw metrics data, caching results for all countries
 */
const fetchAndProcessMetrics =
  async (): Promise<ProcessedMetricsCache | null> => {
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
      return null;
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

    // Cache the processed data in memory
    memoryCache = {
      byCountry,
      global,
      timestamp: Date.now(),
    };

    // Also cache in Redis for persistence across deployments
    const redisData: RedisMetricsCache = {
      byCountry: Object.fromEntries(byCountry.entries()), // Convert Map to Record
      global,
      timestamp: Date.now(),
    };

    await redis.setex(
      REDIS_CACHE_KEY,
      72 * 60 * 60, // 72 hours, since metrics only updates every few hours
      JSON.stringify(redisData),
    );

    return memoryCache;
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

  // Check in-memory cache first
  if (memoryCache) {
    const age = now - memoryCache.timestamp;
    if (age < MEMORY_CACHE_TTL) {
      return country
        ? memoryCache.byCountry.get(country.toUpperCase()) || []
        : memoryCache.global;
    }
  }

  // Memory cache is stale or doesn't exist, check Redis
  if (!redis) {
    console.warn("Redis client not available, fetching fresh data");
  } else {
    try {
      const cached = await redis.get(REDIS_CACHE_KEY);
      if (cached) {
        const redisData: RedisMetricsCache = JSON.parse(cached);
        const age = now - redisData.timestamp;

        memoryCache = {
          byCountry: new Map(Object.entries(redisData.byCountry)),
          global: redisData.global,
          timestamp: redisData.timestamp,
        };

        // We will return this data but not immediately since we want to trigger a new fetch in the background
        if (age < MEMORY_CACHE_TTL) {
          return country
            ? memoryCache.byCountry.get(country.toUpperCase()) || []
            : memoryCache.global;
        }
      }
    } catch (error) {
      console.error("Error reading from Redis cache:", error);
    }
  }

  if (pendingFetch) {
    if (memoryCache) {
      return country
        ? memoryCache.byCountry.get(country.toUpperCase()) || []
        : memoryCache.global;
    } else {
      await pendingFetch;
      return country
        ? memoryCache!.byCountry.get(country.toUpperCase()) || []
        : memoryCache!.global;
    }
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

  // If we have stale data, return it immediately while background fetch completes
  if (memoryCache) {
    pendingFetch.catch((error) => {
      console.error("Error fetching metrics", { error });
    });
    return country
      ? memoryCache.byCountry.get(country.toUpperCase()) || []
      : memoryCache.global;
  } else {
    const result = await pendingFetch;

    if (!result) {
      console.error("Failed to fetch metrics data");
      return [];
    }

    return country
      ? result.byCountry.get(country.toUpperCase()) || []
      : result.global;
  }
};
