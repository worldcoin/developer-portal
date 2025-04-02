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

      const ddTrace = await import("dd-trace");

      const tracer = ddTrace.default.init({
        env: process.env.ENV,
        service: process.env.SERVICE_NAME,
        version: process.env.SERVICE_VERSION,
        sampleRate: 1,
        profiling: true,
        runtimeMetrics: true,
        logInjection: true,
        dogstatsd: {
          hostname: "localhost",
          port: 8125,
        },
      });

      // Monitor GraphQL
      tracer.use("graphql", {
        enabled: true,
        measured: true,
      });

      // Monitor Next.js
      tracer.use("next", {
        enabled: true,
        measured: true,
      });

      // Monitor Winston Logger
      tracer.use("winston", {
        enabled: true,
      });

      const provider = new tracer.TracerProvider();

      provider.register();
    }
  } catch (error) {
    return console.error("🔴 Instrumentation registration error: ", error);
  }

  console.log("✅ Instrumentation registration complete.");
}
