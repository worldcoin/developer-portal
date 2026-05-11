import { checkRateLimit } from "@/api/helpers/rate-limit";

jest.mock(
  "@/lib/logger",
  () => ({
    logger: {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  }),
  { virtual: true },
);

const redis = global.RedisClient as {
  flushall: () => Promise<unknown>;
  set: (key: string, value: string) => Promise<unknown>;
  ttl: (key: string) => Promise<number>;
  get: (key: string) => Promise<string | null>;
};

beforeEach(async () => {
  await redis.flushall();
});

describe("checkRateLimit — atomic INCR + EXPIRE", () => {
  it("admits the first call and sets a TTL on the counter", async () => {
    const decision = await checkRateLimit({
      scope: "test",
      key: "k1",
      windows: [{ label: "minute", limit: 5, periodSeconds: 60 }],
    });
    expect(decision).toEqual({ ok: true });
    const ttl = await redis.ttl("ratelimit:test:minute:k1");
    // Some Redis variants report ttl as 60 immediately; ioredis-mock can
    // sometimes report -1 right after EXPIRE in older releases, so accept
    // any value that's clearly within the configured window.
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(60);
  });

  it("blocks the call that crosses the limit", async () => {
    const window = { label: "minute", limit: 3, periodSeconds: 60 };
    for (let i = 0; i < 3; i++) {
      const ok = await checkRateLimit({
        scope: "test",
        key: "k2",
        windows: [window],
      });
      expect(ok.ok).toBe(true);
    }
    const blocked = await checkRateLimit({
      scope: "test",
      key: "k2",
      windows: [window],
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok === false) {
      expect(blocked.window.label).toBe("minute");
      expect(blocked.resetIn).toBeGreaterThan(0);
      expect(blocked.resetIn).toBeLessThanOrEqual(60);
    }
  });

  it("self-heals a stuck counter that has no TTL", async () => {
    // Simulate a key left over from before INCR/EXPIRE became atomic:
    // counter is well past the limit and has no expiry, so without
    // self-heal the bucket would lock the API key forever.
    const fullKey = "ratelimit:test:minute:stuck";
    await redis.set(fullKey, "200");
    expect(await redis.ttl(fullKey)).toBe(-1);

    const decision = await checkRateLimit({
      scope: "test",
      key: "stuck",
      windows: [{ label: "minute", limit: 5, periodSeconds: 60 }],
    });

    expect(decision.ok).toBe(false);
    if (decision.ok === false) {
      // Resetting in 1s would be misleading and lets the bucket loop
      // forever; the self-heal must surface a real window-length retry.
      expect(decision.resetIn).toBeGreaterThan(1);
      expect(decision.resetIn).toBeLessThanOrEqual(60);
    }
    // Counter now has a real TTL — it'll actually expire.
    const newTtl = await redis.ttl(fullKey);
    expect(newTtl).toBeGreaterThan(0);
    expect(newTtl).toBeLessThanOrEqual(60);
  });

  it("falls open when Redis is unavailable", async () => {
    const original = global.RedisClient;
    (global as { RedisClient?: unknown }).RedisClient = undefined;
    try {
      const decision = await checkRateLimit({
        scope: "test",
        key: "k3",
        windows: [{ label: "minute", limit: 1, periodSeconds: 60 }],
      });
      expect(decision).toEqual({ ok: true });
    } finally {
      (global as { RedisClient?: unknown }).RedisClient = original;
    }
  });

  it("falls open when the Redis call throws", async () => {
    const original = global.RedisClient;
    const failingRedis = {
      eval: () => {
        throw new Error("simulated Redis outage");
      },
      ttl: () => Promise.resolve(-2),
      expire: () => Promise.resolve(0),
    };
    (global as { RedisClient?: unknown }).RedisClient = failingRedis;
    try {
      const decision = await checkRateLimit({
        scope: "test",
        key: "k4",
        windows: [{ label: "minute", limit: 1, periodSeconds: 60 }],
      });
      expect(decision).toEqual({ ok: true });
    } finally {
      (global as { RedisClient?: unknown }).RedisClient = original;
    }
  });
});
