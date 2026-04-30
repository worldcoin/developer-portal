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

// Atomic INCR + first-hit EXPIRE. Running them in a single Redis call
// (Lua under EVAL) means we can never end up in the "counter exists, no
// TTL" state that would otherwise leave a key incrementing forever after
// a transient EXPIRE failure. Returns the post-INCR value.
const INCR_WITH_EXPIRE_SCRIPT = `
  local v = redis.call('INCR', KEYS[1])
  if v == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return v
`;

/**
 * Tiered token-bucket rate limiter backed by Redis. Each window is a fixed
 * counter keyed by (label, key); the first window to exceed its limit
 * short-circuits with the remaining TTL.
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
      const raw = await redis.eval(
        INCR_WITH_EXPIRE_SCRIPT,
        1,
        fullKey,
        String(window.periodSeconds),
      );
      count = Number(raw);
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
      let ttl: number;
      try {
        ttl = await redis.ttl(fullKey);
      } catch {
        ttl = -1;
      }
      // ttl < 0 means either -1 (key has no expiry) or -2 (key gone).
      // The atomic eval above shouldn't leave a fresh counter without
      // a TTL, but a stale key from a pre-fix deploy could land here.
      // Self-heal by setting the TTL so the bucket eventually resets,
      // and surface a full-window retry instead of a misleading 1s.
      if (ttl < 0) {
        try {
          await redis.expire(fullKey, window.periodSeconds);
        } catch {
          // best effort — outer caller still gets a sensible resetIn.
        }
        ttl = window.periodSeconds;
      }
      return { ok: false, window, resetIn: Math.max(ttl, 1) };
    }
  }

  return { ok: true };
};
