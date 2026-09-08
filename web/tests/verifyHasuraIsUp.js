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

const describeError = (error) => {
  const cause = error?.cause?.message ?? error?.cause;
  return cause ? `${error.message} (${cause})` : error?.message ?? `${error}`;
};

async function queryOnce() {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: "query ReadinessProbe { user(limit: 1) { id } }",
    }),
    signal: AbortSignal.timeout(POLL_INTERVAL_MS),
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
      await queryOnce();
      await sleep(CONFIRM_DELAY_MS);
      await queryOnce();
      console.log(`✅ Hasura is query-ready (attempt ${attempt})`);
      return;
    } catch (error) {
      console.log(
        `Waiting for Hasura to serve queries (attempt ${attempt}): ${describeError(error)}`,
      );
    }
    if (Date.now() > deadline) {
      console.error(
        `Hasura was not query-ready within ${MAX_WAIT_MS / 1000}s. ` +
          "Check `docker compose -f ../docker-compose-test.yaml logs hasura_test`.",
      );
      process.exit(1);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

main().catch((error) => {
  console.error("Hasura readiness check crashed:", describeError(error));
  process.exit(1);
});
