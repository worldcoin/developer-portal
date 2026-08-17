const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.test") });

const POLL_INTERVAL = 1000; // 1 second
const MAX_WAIT = 120000; // 120 seconds

// One successful probe only proves Hasura answered once. Require a short streak
// of consecutive successes before handing off — see the note below on why a
// single probe is not enough.
const REQUIRED_CONSECUTIVE_OK = 3;

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
 * It also requires `REQUIRED_CONSECUTIVE_OK` successes in a row rather than one.
 * A single probe proved too weak: Hasura answers a first query and then briefly
 * stalls while it finishes warming up, and the first suite to run fires ~13
 * Hasura calls inside a couple of seconds (every test in `oidc/token.test.ts`
 * opens with `testGetSignInApp()`), so one stall takes the whole file down with
 * identical `SocketError: other side closed` errors. The GraphQL client's own
 * transport retry only covers ~700ms of backoff, which is not enough to ride it
 * out. A streak means we hand off only once Hasura has been stably serving.
 *
 * Probing a real GraphQL query rather than `/healthz` is belt-and-braces. It is
 * not what was broken — with the `cli-migrations-v3` image, migrations are
 * applied before the HTTP server binds, so `/healthz` returning 200 already
 * implies the schema is loaded (measured: both flip to 200 in the same second on
 * a cold start). But this probes exactly what the suite depends on, so it stays
 * correct if that startup ordering ever changes.
 *
 * Output is deliberately plain ASCII: the previous success line started with an
 * emoji and never made it through the GitHub Actions log pipeline, which made it
 * impossible to tell from a failed run whether the gate had confirmed anything.
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
  const startedAt = Date.now();
  const deadline = startedAt + MAX_WAIT;

  let lastFailure = "no attempt made";
  let attempts = 0;
  let consecutiveOk = 0;

  console.log("Checking if Hasura is up and migrations are ready....");

  while (Date.now() < deadline) {
    attempts += 1;

    try {
      const failure = await probeGraphql();

      if (failure === null) {
        consecutiveOk += 1;

        if (consecutiveOk >= REQUIRED_CONSECUTIVE_OK) {
          const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

          console.log(
            `[OK] Hasura is ready and serving (${consecutiveOk} consecutive probes, ${attempts} attempts, ${elapsed}s)`,
          );

          return;
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));

        continue;
      }

      lastFailure = failure;
    } catch (error) {
      // fetch() wraps transport failures, so the useful detail is on `cause`.
      lastFailure =
        error?.cause?.message ?? error?.message ?? String(error) ?? "unknown";
    }

    // Any failure restarts the streak — a stall midway through means Hasura is
    // not yet stable enough to hand a whole test file to.
    consecutiveOk = 0;

    console.log(`  not ready yet (${lastFailure}), retrying...`);

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }

  throw new Error(
    `Maximum wait time exceeded after ${attempts} attempts. Hasura was never stably ready. Last failure: ${lastFailure}`,
  );
};

// Exit non-zero so the `&&` in `pnpm test:integration` actually stops the run.
// The previous version recursed without awaiting, so a timeout surfaced as an
// unhandled rejection rather than a failed gate.
waitForHasura().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
