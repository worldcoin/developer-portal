import { logger } from "@/lib/logger";

export type RateLimitWindow = {
  limit: number;
  periodSeconds: number;
  // Used to scope keys (e.g. "minute", "day") and shows up in error messages.
  label: string;
};

export type RateLimitDecision =
  | { ok: true }
  | {
      ok: false;
      window: RateLimitWindow;
      // Seconds remaining until the window resets, clamped to ≥ 1 so callers
      // never advise a 0-second retry.
      resetIn: number;
    };

/**
 * Tiered token-bucket rate limiter backed by Redis. Each window is a separate
 * INCR/EXPIRE pair keyed by (label, key). The first window to exceed its
 * limit short-circuits with the remaining TTL.
 *
 * Fails open if `global.RedisClient` is unavailable — production should always
 * have Redis, but we log a warning and continue rather than blocking legit
 * traffic on a single infra dependency. Test environments use ioredis-mock
 * which provides the same surface.
 */
export const checkRateLimit = async ({
  scope,
  key,
  windows,
}: {
  scope: string;
  key: string;
  windows: RateLimitWindow[];
}): Promise<RateLimitDecision> => {
  const redis = global.RedisClient;
  if (!redis) {
    logger.warn("Rate limiter falling open — Redis unavailable", {
      scope,
      key,
    });
    return { ok: true };
  }

  for (const window of windows) {
    const fullKey = `ratelimit:${scope}:${window.label}:${key}`;
    let count: number;
    try {
      count = await redis.incr(fullKey);
      if (count === 1) {
        await redis.expire(fullKey, window.periodSeconds);
      }
    } catch (error) {
      logger.warn("Rate limiter Redis failure — falling open", {
        scope,
        key,
        label: window.label,
        error,
      });
      return { ok: true };
    }

    if (count > window.limit) {
      let ttl = window.periodSeconds;
      try {
        ttl = await redis.ttl(fullKey);
      } catch {
        // ignore — keep the conservative ttl above.
      }
      return { ok: false, window, resetIn: Math.max(ttl, 1) };
    }
  }

  return { ok: true };
};
