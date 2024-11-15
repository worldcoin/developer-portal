import { createRedisClient } from "@/lib/redis";
import { getAPIServiceGraphqlClient } from "../graphql";
import { getSdk as getAppRatingSdk } from "./graphql/get-app-rating.generated";

// Helper function to get rating with Redis caching
export async function getAppRating(appId: string): Promise<number> {
  const redisKey = `app:${appId}:rating`;
  const lockKey = `lock:${appId}:rating`;

  const redis = createRedisClient({
    url: process.env.REDIS_URL!,
    password: process.env.REDIS_PASSWORD!,
    username: process.env.REDIS_USERNAME!,
  });

  try {
    // Try to get from cache first
    let rating = await redis.get(redisKey);

    if (rating !== null) {
      return parseFloat(rating);
    }

    // Try to acquire lock
    const acquiredLock = await redis.set(lockKey, "pending", "EX", 30);

    if (!acquiredLock) {
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        rating = await redis.get(redisKey);
        if (rating !== null) {
          return parseFloat(rating);
        }
      }

      console.warn("Lock timeout for app rating calculation", { appId });
    }
    const client = await getAPIServiceGraphqlClient();

    // Calculate rating from DB
    const result = await getAppRatingSdk(client).GetAppRating({
      app_id: appId,
    });

    const calculatedRating = result.app_metadata[0].app_rating ?? 0;

    // Cache for 24 hours
    await redis.set(redisKey, calculatedRating.toString(), "EX", 24 * 60 * 60);

    return calculatedRating; // Return as float
  } catch (error) {
    console.warn("Error getting app rating with cache", { error, appId });
    return 0; // Return 0 if there's an error
  } finally {
    try {
      await redis.del(lockKey);
      await redis.quit();
    } catch (redisError) {
      console.error("Error closing Redis connection", { redisError });
    }
  }
}
