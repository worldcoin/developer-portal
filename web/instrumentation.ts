export async function register() {
  console.log("🛠️ Starting Instrumentation registration...");

  try {
    if (
      typeof window === "undefined" &&
      process.env.NEXT_RUNTIME === "nodejs"
    ) {
      console.log("Registering dd-trace");

      const ddTrace = await import("dd-trace");

      const tracer = ddTrace.default.init();

      // Monitor HTTP requests
      tracer.use("http", {
        // Should block requests to Next internal endpoints
        blocklist: [/\/_next\//],
        hooks: {
          request(span, req, res) {
            if (span && req) {
              const urlString = "path" in req ? req.path : req.url;

              if (urlString) {
                const url = new URL(urlString, "http://localhost");
                const resourceGroup = url.pathname;
                const method = req.method;

                span.setTag(
                  "resource.name",
                  method ? `${method} ${resourceGroup}` : resourceGroup,
                );
              }
            }
          },
        },
      });

      // Disable the Next.js instrumentation as it creates duplicate spans
      tracer.use("next", {
        enabled: false,
      });

      console.log("dd-trace registered");

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
    }
  } catch (error) {
    return console.error("🔴 Instrumentation registration error: ", error);
  }

  console.log("✅ Instrumentation registration complete.");
}
