import { AppStatsReturnType, MetricsServiceAppData } from "@/lib/types";
import { fetchWithRetry } from "@/lib/utils";

const pendingRequests = new Map<string, Promise<AppStatsReturnType>>();

/**
 * Fetch metrics from the metrics service with request deduplication
 *
 * This function ensures that multiple concurrent requests for the same data
 * (same country) will share a single network request and JSON parsing operation.
 *
 * @param expirationTime - The time to cache the data for in seconds (passed to HTTP headers)
 * @param country - The country to fetch data for
 * @returns The metrics data with the country data if specified, otherwise sum all values
 */
export const fetchMetrics = async (
  expirationTime: number = 3600, // Default to 1 hour (3600 seconds)
  country?: string | null,
): Promise<AppStatsReturnType> => {
  const requestKey = `metrics_${country || "all"}`;

  const pendingRequest = pendingRequests.get(requestKey);
  if (pendingRequest) {
    return pendingRequest;
  }

  const requestPromise = (async () => {
    try {
      const fetchOptions: RequestInit = {};

      if (expirationTime <= 0) {
        fetchOptions.cache = "no-store";
        fetchOptions.headers = {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Expires: "0",
        };
      } else {
        fetchOptions.headers = {
          "Cache-Control": `max-age=${Math.floor(expirationTime)}`,
        };
      }

      const response = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_METRICS_SERVICE_ENDPOINT}/stats/data.json`,
        fetchOptions,
        3,
        400,
        false,
      );

      if (response.status !== 200) {
        console.error("Failed to fetch metrics", {
          status: response.status,
          statusText: response.statusText,
        });
        return [];
      }

      const responseData: MetricsServiceAppData[] = await response.json();
      let metricsData: AppStatsReturnType = [];

      if (country) {
        // If country is specified return the value for that Country code
        // for unique_users_last_7_days, new_users_last_7_days, and total_users_last_7_days
        const upperCountry = country.toUpperCase();
        metricsData = responseData.map((app) => {
          let uniqueUsers: number | undefined;
          let newUsers: number | undefined;
          let totalUsers: number | undefined;

          if (app.unique_users_last_7_days) {
            const userData = app.unique_users_last_7_days.find(
              (user) => user.country?.toUpperCase() === upperCountry,
            );
            uniqueUsers = userData?.value;
          }

          if (app.new_users_last_7_days) {
            const userData = app.new_users_last_7_days.find(
              (user) => user.country?.toUpperCase() === upperCountry,
            );
            newUsers = userData?.value;
          }

          if (app.total_users_last_7_days) {
            const userData = app.total_users_last_7_days.find(
              (user) => user.country?.toUpperCase() === upperCountry,
            );
            totalUsers = userData?.value;
          }

          return {
            ...app,
            unique_users_last_7_days: uniqueUsers,
            new_users_last_7_days: newUsers,
            total_users_last_7_days: totalUsers,
          };
        });
      } else {
        metricsData = responseData.map((app) => {
          let uniqueUsersSum = 0;
          let newUsersSum = 0;
          let totalUsersSum = 0;

          if (app.unique_users_last_7_days) {
            for (const user of app.unique_users_last_7_days) {
              uniqueUsersSum += Number(user.value) || 0;
            }
          }

          if (app.new_users_last_7_days) {
            for (const user of app.new_users_last_7_days) {
              newUsersSum += Number(user.value) || 0;
            }
          }

          if (app.total_users_last_7_days) {
            for (const user of app.total_users_last_7_days) {
              totalUsersSum += Number(user) || 0;
            }
          }

          return {
            ...app,
            unique_users_last_7_days: uniqueUsersSum || undefined,
            new_users_last_7_days: newUsersSum || undefined,
            total_users_last_7_days: totalUsersSum || undefined,
          };
        });
      }

      return metricsData;
    } finally {
      pendingRequests.delete(requestKey);
    }
  })();

  pendingRequests.set(requestKey, requestPromise);

  return requestPromise;
};
