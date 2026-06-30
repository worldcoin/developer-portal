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
