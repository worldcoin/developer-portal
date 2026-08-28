import IORedis from "ioredis-mock";
import "whatwg-fetch";

// `next/config` (runtime config) was removed in Next 16. NEXT_PUBLIC_* values are
// already on `process.env`, so consumers read them there directly (see
// tests/integration/test-utils.ts) — no `setConfig` shim needed.

// Create the mock Redis client
const redisMock = new IORedis();

// Set the global mock
global.RedisClient = redisMock;

export const MOCKED_GENERAL_SECRET_KEY =
  "0xsuperSecretKey99994ab56046d4d97695b9999999";

process.env.GENERAL_SECRET_KEY = MOCKED_GENERAL_SECRET_KEY;

// Keep the integration clients on the same isolated ports published by
// docker-compose-test.yaml. Supplying either override to the server and test
// commands is enough; the test process does not silently fall back to another
// checkout's default database or Hasura instance.
if (process.env.POSTGRES_TEST_PORT) {
  process.env.PGPORT = process.env.POSTGRES_TEST_PORT;
}

if (process.env.HASURA_TEST_PORT) {
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL = `http://127.0.0.1:${process.env.HASURA_TEST_PORT}/v1/graphql`;
}
