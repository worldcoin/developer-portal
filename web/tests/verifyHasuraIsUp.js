const parsePositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const POLL_INTERVAL_MS = parsePositiveInteger(
  process.env.HASURA_TEST_POLL_INTERVAL_MS,
  2000,
);
const MAX_WAIT_MS = parsePositiveInteger(
  process.env.HASURA_TEST_MAX_WAIT_MS,
  120000,
);
const REQUIRED_CONSECUTIVE_PROBES = 2;
const portOrigin = process.env.HASURA_TEST_PORT
  ? `http://127.0.0.1:${process.env.HASURA_TEST_PORT}`
  : undefined;
const GRAPHQL_URL =
  (portOrigin ? `${portOrigin}/v1/graphql` : undefined) ??
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL ??
  "http://localhost:8081/v1/graphql";
const HEALTH_URL =
  process.env.HASURA_TEST_HEALTH_URL ??
  (portOrigin ? `${portOrigin}/healthz` : undefined) ??
  new URL("/healthz", GRAPHQL_URL).toString();

const fetchBeforeDeadline = (url, init, deadlineAt) => {
  const remainingMs = deadlineAt - Date.now();
  if (remainingMs <= 0) {
    throw new Error("Hasura readiness deadline elapsed.");
  }
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(Math.max(1, remainingMs)),
  });
};

const probeHasura = async (deadlineAt) => {
  const healthResponse = await fetchBeforeDeadline(
    HEALTH_URL,
    undefined,
    deadlineAt,
  );
  if (!healthResponse.ok) {
    return false;
  }

  const headers = { "content-type": "application/json" };
  if (process.env.HASURA_GRAPHQL_ADMIN_SECRET) {
    headers["x-hasura-admin-secret"] = process.env.HASURA_GRAPHQL_ADMIN_SECRET;
  }
  const graphqlResponse = await fetchBeforeDeadline(
    GRAPHQL_URL,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: "query IntegrationReadiness { __typename }",
      }),
    },
    deadlineAt,
  );
  if (!graphqlResponse.ok) {
    return false;
  }

  const body = await graphqlResponse.json();
  return body?.data?.__typename === "query_root" && !body.errors;
};

const waitForHasura = async () => {
  const deadlineAt = Date.now() + MAX_WAIT_MS;
  let consecutiveReadyProbes = 0;

  while (Date.now() < deadlineAt) {
    console.log(
      "Checking if Hasura health, metadata, and GraphQL queries are ready....",
    );
    try {
      if (await probeHasura(deadlineAt)) {
        consecutiveReadyProbes += 1;
        if (consecutiveReadyProbes >= REQUIRED_CONSECUTIVE_PROBES) {
          console.log("✅ Hasura is ready");
          return;
        }
      } else {
        consecutiveReadyProbes = 0;
      }
    } catch (error) {
      consecutiveReadyProbes = 0;
      console.log("Hasura readiness probe is not ready yet:", error);
    }

    const remainingMs = deadlineAt - Date.now();
    if (remainingMs > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(POLL_INTERVAL_MS, remainingMs)),
      );
    }
  }

  throw new Error(
    `Hasura was not query-ready at ${GRAPHQL_URL} within ${MAX_WAIT_MS}ms.`,
  );
};

waitForHasura().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
