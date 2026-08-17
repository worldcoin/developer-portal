const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.test") });

const POLL_INTERVAL = 2000; // 2 seconds
const MAX_WAIT = 120000; // 120 seconds

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL ?? "http://localhost:8081/v1/graphql";

const ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET ?? "secret!";

/**
 * Readiness gate for the integration suite's Hasura.
 *
 * The previous version's retry loop did not work: it called itself
 * fire-and-forget (`loop()` with no `await`, from a top-level call with no
 * `await` and no `.catch()`), so the process exit code was decoupled from
 * whether readiness had ever been confirmed. A run whose first probe failed
 * exited 0 anyway and let `jest` start against a Hasura that was still booting —
 * every test in whichever suite happened to run first died on
 * `TypeError: fetch failed` / `SocketError: other side closed` while all the
 * later suites passed, which reads as a flaky test rather than a broken gate.
 * Hasura takes ~18s to come up from cold here and CI gave it ~22s, so this was
 * a coin flip that landed wrong on two branches within ten minutes.
 *
 * The loop below is fully awaited, prints its confirmation on the single success
 * path, and exits non-zero if the deadline passes.
 *
 * Probing a real GraphQL query rather than `/healthz` is belt-and-braces. It is
 * not what was broken — with the `cli-migrations-v3` image, migrations are
 * applied before the HTTP server binds, so `/healthz` returning 200 already
 * implies the schema is loaded (measured: both flip to 200 in the same second on
 * a cold start). But this probes exactly what the suite depends on, so it stays
 * correct if that startup ordering ever changes.
 */
const probeGraphql = async () => {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hasura-admin-secret": ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: "query Readiness { user(limit: 1) { id } }",
    }),
  });

  if (!response.ok) {
    return `HTTP ${response.status}`;
  }

  const body = await response.json();

  if (body.errors) {
    return `GraphQL errors: ${JSON.stringify(body.errors)}`;
  }

  return null;
};

const waitForHasura = async () => {
  const deadline = Date.now() + MAX_WAIT;
  let lastFailure = "no attempt made";

  while (Date.now() < deadline) {
    console.log("Checking if Hasura is up and migrations are ready....");

    try {
      const failure = await probeGraphql();

      if (failure === null) {
        console.log("✅ Hasura is ready");

        return;
      }

      lastFailure = failure;
    } catch (error) {
      // fetch() wraps transport failures, so the useful detail is on `cause`.
      lastFailure =
        error?.cause?.message ?? error?.message ?? String(error) ?? "unknown";
    }

    console.log(`   not ready yet (${lastFailure}), retrying...`);

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }

  throw new Error(
    `Maximum wait time exceeded. Hasura was never ready. Last failure: ${lastFailure}`,
  );
};

// Exit non-zero so the `&&` in `pnpm test:integration` actually stops the run.
// The previous version recursed without awaiting, so a timeout surfaced as an
// unhandled rejection rather than a failed gate.
waitForHasura().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
