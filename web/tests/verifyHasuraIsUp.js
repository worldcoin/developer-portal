const TABLES = ["app", "action", "auth_code", "invite"];
const QUERY = `query IntegrationReadiness {
  app(limit: 1) { id }
  action(limit: 1) { id }
  auth_code(limit: 1) { id }
  invite(limit: 1) { id }
}`;

/**
 * Check the migrated database through GraphQL, not just the HTTP health endpoint.
 * @param {{ url: string, adminSecret: string, timeoutMs?: number, requestTimeoutMs?: number }} options
 */
async function waitForHasura({
  url,
  adminSecret,
  timeoutMs = 120_000,
  requestTimeoutMs = 5_000,
}) {
  if (!url || !["http:", "https:"].includes(new URL(url).protocol)) {
    throw new Error("NEXT_PUBLIC_GRAPHQL_API_URL must be an HTTP(S) URL.");
  }
  if (!adminSecret) {
    throw new Error("HASURA_GRAPHQL_ADMIN_SECRET is required for readiness.");
  }

  const startedAt = Date.now();
  const deadline = startedAt + timeoutMs;
  let attempt = 0;
  let lastError;

  while (Date.now() < deadline) {
    attempt += 1;
    const controller = new AbortController();
    // A referenced timer also keeps Node alive while fetch is pending.
    const timeout = setTimeout(
      () => controller.abort(new Error("Hasura readiness request timed out")),
      Math.min(requestTimeoutMs, deadline - Date.now()),
    );
    let status;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hasura-admin-secret": adminSecret,
        },
        body: JSON.stringify({ query: QUERY }),
        redirect: "error",
        signal: controller.signal,
      });
      status = response.status;
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`Hasura returned HTTP ${status}`);
      }

      const payload = await response.json();
      if (
        !payload ||
        (payload.errors && payload.errors.length !== 0) ||
        !TABLES.every((table) => Array.isArray(payload.data?.[table]))
      ) {
        throw new Error("Hasura GraphQL schema or database is not ready");
      }
      return;
    } catch (error) {
      lastError = error;
      console.warn("Hasura readiness probe failed", {
        dependency: "hasura",
        attempt,
        elapsedMs: Date.now() - startedAt,
        upstreamStatus: status,
        failureClass: controller.signal.aborted ? "timeout" : "request_failed",
        error: error.message,
        cause: error.cause?.code ?? error.cause?.message,
      });
    } finally {
      clearTimeout(timeout);
    }

    const backoff = Math.min(2_000, 200 * 2 ** Math.min(attempt - 1, 4));
    const delay = backoff / 2 + Math.random() * (backoff / 2);
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, Math.min(delay, deadline - Date.now()))),
    );
  }

  throw new Error(
    `Hasura GraphQL did not become ready within ${timeoutMs}ms: ${lastError?.message}`,
    { cause: lastError },
  );
}

module.exports = { waitForHasura };

if (require.main === module) {
  // Never let an unfinished readiness check allow the following Jest command to run.
  process.exitCode = 1;
  const main = async () => {
    process.env.NODE_ENV = "test";
    require("@next/env").loadEnvConfig(
      require("node:path").resolve(__dirname, ".."),
    );
    console.log(
      "Waiting for Hasura GraphQL and the integration-test schema...",
    );
    await waitForHasura({
      url: process.env.NEXT_PUBLIC_GRAPHQL_API_URL,
      adminSecret: process.env.HASURA_GRAPHQL_ADMIN_SECRET,
    });
    console.log("Hasura GraphQL is ready.");
    process.exitCode = 0;
  };
  main().catch((error) => console.error(error));
}
