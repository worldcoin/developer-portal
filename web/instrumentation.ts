export async function register() {
  console.log("🛠️ Starting Instrumentation registration...");

  try {
    if (
      typeof window === "undefined" &&
      process.env.NEXT_RUNTIME === "nodejs"
    ) {
      const { createRedisClient } = await import("./lib/redis");

      if (
        !process.env.REDIS_URL ||
        !process.env.REDIS_USERNAME ||
        !process.env.REDIS_PASSWORD
      ) {
        return console.error(
          "🔴 Missing Redis configuration in instrumentation.ts",
        );
      }

      const redis = createRedisClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
        username: process.env.REDIS_USERNAME,
      });

      global.RedisClient = redis;
    }
  } catch (error) {
    return console.error("🔴 Instrumentation registration error: ", error);
  }

  console.log("✅ Instrumentation registration complete.");
}
