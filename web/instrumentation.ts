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

      const { OpenSearchClient } = await import("./lib/opensearch");

      if (!process.env.OPENSEARCH_ENDPOINT) {
        return console.error(
          "🔴 Missing OpenSearch configuration in instrumentation.ts",
        );
      }

      const opensearch = new OpenSearchClient({
        url: process.env.OPENSEARCH_ENDPOINT,
        indexName: "app_metadata",
      });
      opensearch.createIndexIfNotExists();

      global.OpenSearchClient = opensearch;

      const { ParameterStore } = await import("./lib/parameter-store");
      global.ParameterStore = new ParameterStore("developer-portal");
    }
  } catch (error) {
    return console.error("🔴 Instrumentation registration error: ", error);
  }

  console.log("✅ Instrumentation registration complete.");
}
