export async function register() {
  console.log("🛠️ Starting Instrumentation registration...");

  try {
    if (
      typeof window === "undefined" &&
      process.env.NEXT_RUNTIME === "nodejs"
    ) {
      if (process.env.AWS_ENDPOINT_URL_S3 && !process.env.AWS_PROFILE) {
        process.env.AWS_ACCESS_KEY_ID ??= "test";
        process.env.AWS_SECRET_ACCESS_KEY ??= "test";
      }
      const { ParameterStore } = await import("./lib/parameter-store");
      global.ParameterStore = new ParameterStore("developer-portal");

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

      const { createSignedFetcher } = await import("aws-sigv4-fetch");
      global.TransactionSignedFetcher = createSignedFetcher({
        service: "execute-api",
        region: process.env.TRANSACTION_BACKEND_REGION,
      });
    }
  } catch (error) {
    return console.error("🔴 Instrumentation registration error: ", error);
  }

  console.log("✅ Instrumentation registration complete.");
}
