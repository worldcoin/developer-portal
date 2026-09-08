// Readiness gate for the integration test stack. A /healthz 200 is not enough:
// the cli-migrations Hasura image applies migrations/metadata and then swaps
// engines, so the port can answer healthz and drop connections moments later.
// Ready = a real GraphQL query (final engine + applied migrations) succeeding
// twice in a row across the swap window.
const GRAPHQL_URL = "http://localhost:8081/v1/graphql";
const ADMIN_SECRET = "secret!"; // test-only, matches docker-compose-test.yaml
const POLL_INTERVAL_MS = 2000;
const CONFIRM_DELAY_MS = 1500;
const MAX_WAIT_MS = 120000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const remainingMs = (deadline) => {
  const remaining = deadline - Date.now();
  if (remaining <= 0) {
    throw new Error("Readiness deadline exceeded");
  }
  return remaining;
};

const describeError = (error) => {
  const cause = error?.cause?.message ?? error?.cause;
  return cause ? `${error.message} (${cause})` : error?.message ?? `${error}`;
};

async function queryOnce(deadline) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: "query ReadinessProbe { user(limit: 1) { id } }",
    }),
    signal: AbortSignal.timeout(
      Math.min(POLL_INTERVAL_MS, remainingMs(deadline)),
    ),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const body = await response.json();
  if (body.errors?.length) {
    throw new Error(
      `GraphQL error: ${body.errors[0]?.message ?? JSON.stringify(body.errors[0])}`,
    );
  }
  if (!body.data) {
    throw new Error("GraphQL response had no data");
  }
}

async function main() {
  const deadline = Date.now() + MAX_WAIT_MS;
  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      await queryOnce(deadline);
      await sleep(Math.min(CONFIRM_DELAY_MS, remainingMs(deadline)));
      await queryOnce(deadline);
      console.log(`✅ Hasura is query-ready (attempt ${attempt})`);
      return;
    } catch (error) {
      console.log(
        `Waiting for Hasura to serve queries (attempt ${attempt}): ${describeError(error)}`,
      );
    }
    if (Date.now() >= deadline) {
      console.error(
        `Hasura was not query-ready within ${MAX_WAIT_MS / 1000}s. ` +
          "Check `docker compose -f ../docker-compose-test.yaml logs hasura_test`.",
      );
      process.exit(1);
    }
    await sleep(Math.min(POLL_INTERVAL_MS, Math.max(0, deadline - Date.now())));
  }
}

main().catch((error) => {
  console.error("Hasura readiness check crashed:", describeError(error));
  process.exit(1);
});
