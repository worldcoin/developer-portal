import "server-only";

import { createSignedFetcher } from "aws-sigv4-fetch";

/**
 * Module-scoped, lazily-initialised SigV4 signed-fetch singleton for the
 * `execute-api` service in `TRANSACTION_BACKEND_REGION`.
 *
 * `aws-sigv4-fetch` (via `@aws-sdk/credential-provider-node`) caches resolved
 * IAM credentials on the signer instance. Constructing a new signer per
 * request — as we used to do in every handler — defeats that cache and
 * hammers the ECS task IAM-role credential endpoint (`169.254.170.2`),
 * which has produced "socket hang up" regressions in production.
 *
 * Prefer the global set by `instrumentation.ts` so we share a single signer
 * across all entry points; fall back to a local lazy singleton if
 * instrumentation never ran (e.g. it bailed early on missing Redis /
 * OpenSearch env, see the early `return console.error` paths there). Either
 * way every caller in the process reuses one signer, so the underlying
 * credential provider chain is built once and credentials get cached for
 * their full TTL.
 */
let cachedSignedFetch: typeof fetch | undefined;

export const getTransactionSignedFetch = (): typeof fetch => {
  if (global.TransactionSignedFetcher) {
    return global.TransactionSignedFetcher;
  }

  if (!cachedSignedFetch) {
    cachedSignedFetch = createSignedFetcher({
      service: "execute-api",
      region: process.env.TRANSACTION_BACKEND_REGION,
    });
  }

  return cachedSignedFetch;
};
