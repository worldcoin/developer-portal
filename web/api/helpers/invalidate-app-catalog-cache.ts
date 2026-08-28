import { clearMetricsCache } from "@/api/helpers/fetch-metrics";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import "server-only";

const DEBOUNCE_KEY = "invalidate_cache_lock";

export const invalidateAppCatalogCache = async ({
  callerReference,
  abortSignal,
}: {
  callerReference: string;
  abortSignal?: AbortSignal;
}): Promise<{ invalidationId: string | null; debounced: boolean }> => {
  const region = process.env.ASSETS_S3_REGION;
  const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
  if (!region || !distributionId) {
    throw new Error("App catalog cache invalidation is not configured.");
  }
  if (!/^[A-Za-z0-9:_-]{1,128}$/.test(callerReference)) {
    throw new Error("Invalid cache invalidation reference.");
  }

  const redis = global.RedisClient;
  if (!redis) throw new Error("App catalog cache is unavailable.");

  const acquired = await redis.set(
    DEBOUNCE_KEY,
    callerReference,
    "EX",
    60,
    "NX",
  );
  if (acquired !== "OK") return { invalidationId: null, debounced: true };
  try {
    await clearMetricsCache();
    const client = new CloudFrontClient({ region });
    const command = new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: 2,
          Items: ["/api/v2/public/app/*", "/api/v2/public/apps*"],
        },
        CallerReference: callerReference,
      },
    });
    const response = abortSignal
      ? await client.send(command, { abortSignal })
      : await client.send(command);
    return {
      invalidationId: response.Invalidation?.Id ?? null,
      debounced: false,
    };
  } catch (error) {
    await redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1,
      DEBOUNCE_KEY,
      callerReference,
    );
    throw error;
  }
};
