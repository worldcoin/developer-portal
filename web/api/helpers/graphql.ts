import "server-only";

import {
  generateAPIKeyJWT,
  generateReviewerJWT,
  generateServiceJWT,
} from "@/api/helpers/jwts";
import { logger } from "@/lib/logger";
import { parse } from "graphql";
import { GraphQLClient } from "graphql-request";

/** Total per-request timeout, including any retry attempts. */
const REQUEST_TIMEOUT_MS = 15_000;

/** Retry plan for idempotent (query) operations only. Backoffs in ms, applied
 *  between attempts. Length = max retries beyond the first attempt. */
const QUERY_RETRY_BACKOFFS_MS = [200, 500];

/**
 * Inspect a serialized GraphQL request body (the JSON `graphql-request` puts on
 * the wire) and decide whether the operation is safe to retry.
 *
 * Returns true only when we can prove the operation is a `query` (or
 * `subscription`, which is moot here since we use HTTP). If the body is a
 * batch, missing, or fails to parse, we conservatively return false so we
 * never retry an operation that might be a mutation.
 */
export const isRetryableOperation = (body: BodyInit | null | undefined) => {
  if (typeof body !== "string" || body.length === 0) {
    return false;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return false;
  }

  // Batch requests are arrays — refuse to retry the whole batch since it may
  // mix queries and mutations.
  if (Array.isArray(parsed)) {
    return false;
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as { query?: unknown }).query !== "string"
  ) {
    return false;
  }

  const query = (parsed as { query: string }).query;

  try {
    const doc = parse(query);
    // Every top-level operation definition must be a query (or subscription).
    // If any is a mutation, we must not retry.
    let sawOperation = false;
    for (const def of doc.definitions) {
      if (def.kind !== "OperationDefinition") continue;
      sawOperation = true;
      if (def.operation !== "query" && def.operation !== "subscription") {
        return false;
      }
    }
    return sawOperation;
  } catch {
    return false;
  }
};

/**
 * Returns true when a thrown error represents a transport-level failure (no
 * HTTP response received), e.g. socket reset, DNS failure, connection refused,
 * or per-attempt timeout. Errors carrying a `Response` (4xx/5xx) never reach
 * here — `fetch` resolves with the response instead of throwing.
 */
const isTransportError = (err: unknown) => {
  if (!err || typeof err !== "object") return false;

  // `AbortSignal.timeout` fires `TimeoutError`/`AbortError` — treat as
  // transport-class since no response was received.
  const name = (err as { name?: string }).name;
  if (name === "AbortError" || name === "TimeoutError") return true;

  // Node 20 / undici raises `TypeError: fetch failed` with a `cause` carrying
  // the underlying socket error.
  const errno = (err as { code?: string }).code;
  if (typeof errno === "string" && TRANSPORT_ERROR_CODES.has(errno))
    return true;

  const cause = (err as { cause?: unknown }).cause;
  if (cause && typeof cause === "object") {
    const causeCode = (cause as { code?: string }).code;
    if (typeof causeCode === "string" && TRANSPORT_ERROR_CODES.has(causeCode)) {
      return true;
    }
    const causeName = (cause as { name?: string }).name;
    if (causeName === "AbortError" || causeName === "TimeoutError") return true;
  }

  // Last-resort substring match for environments where the error metadata
  // doesn't carry a code (older undici, polyfilled fetch in tests).
  const message = (err as { message?: string }).message ?? "";
  if (typeof message === "string" && message.length > 0) {
    if (
      message.includes("fetch failed") ||
      message.includes("socket hang up") ||
      message.includes("network timeout")
    ) {
      return true;
    }
  }

  return false;
};

const TRANSPORT_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ENOTFOUND",
  "EPIPE",
  "UND_ERR_SOCKET",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
]);

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// Bind to the native fetch reference captured at module load. This matches
// `graphql-request`'s own behaviour (its default fetch is resolved at import
// time, not at call time) and prevents test code that does
// `global.fetch = jest.fn(...)` — used to mock OTHER outbound calls like the
// sequencer in `web/tests/integration/api/v2/verify.test.ts` — from
// accidentally intercepting the Hasura request that this wrapper makes.
const baseFetch: typeof fetch = globalThis.fetch.bind(globalThis);

/**
 * Combine the caller's optional AbortSignal with a per-attempt timeout signal.
 * Uses `AbortSignal.any` when available (Node >= 20.3); falls back to a manual
 * combiner so this stays portable across environments.
 */
const combineSignals = (
  callerSignal: AbortSignal | null | undefined,
  timeoutMs: number,
): AbortSignal => {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  if (!callerSignal) return timeoutSignal;

  const anyFn = (
    AbortSignal as unknown as {
      any?: (signals: AbortSignal[]) => AbortSignal;
    }
  ).any;
  if (typeof anyFn === "function") {
    return anyFn([callerSignal, timeoutSignal]);
  }

  // Manual fallback: forward whichever signal aborts first.
  const controller = new AbortController();
  const forward = (source: AbortSignal) => () => {
    if (!controller.signal.aborted) {
      controller.abort((source as { reason?: unknown }).reason);
    }
  };
  if (callerSignal.aborted) {
    controller.abort((callerSignal as { reason?: unknown }).reason);
  } else if (timeoutSignal.aborted) {
    controller.abort((timeoutSignal as { reason?: unknown }).reason);
  } else {
    callerSignal.addEventListener("abort", forward(callerSignal), {
      once: true,
    });
    timeoutSignal.addEventListener("abort", forward(timeoutSignal), {
      once: true,
    });
  }
  return controller.signal;
};

/**
 * Build a `fetch` replacement, suitable for `graphql-request`'s `GraphQLClient`,
 * that:
 *   - applies a 15s `AbortSignal.timeout` to every attempt
 *   - retries up to 2 extra times (3 attempts total) on transport-level
 *     errors, but ONLY when the body is provably a `query` operation
 *   - never retries on a received HTTP response (4xx/5xx), and never retries
 *     mutations or batch requests
 *
 * Takes the underlying fetch as an argument so tests can inject a mock without
 * having to override `globalThis.fetch` (which would also intercept unrelated
 * calls in the same test process). Production builds via {@link graphqlFetchWithRetry}
 * pass the module-load-time `baseFetch`.
 */
export const makeGraphqlFetchWithRetry = (
  fetchImpl: typeof fetch,
): typeof fetch => {
  return async (input, init) => {
    const body = init?.body ?? null;
    const retryable = isRetryableOperation(body);
    const callerSignal = init?.signal ?? null;
    const backoffs = retryable ? QUERY_RETRY_BACKOFFS_MS : [];
    const maxAttempts = backoffs.length + 1;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const signal = combineSignals(callerSignal, REQUEST_TIMEOUT_MS);
      try {
        // Pass through everything we received, swapping in our combined signal.
        return await fetchImpl(input, { ...init, signal });
      } catch (err) {
        lastError = err;
        const isLast = attempt === maxAttempts;
        const transport = isTransportError(err);
        // If the caller asked to cancel (route timeout, client disconnect,
        // upstream short-circuit), honour it immediately rather than treating
        // the resulting AbortError as a retryable transport failure.
        const callerAborted = callerSignal?.aborted ?? false;

        if (isLast || !transport || callerAborted) {
          throw err;
        }

        const delay = backoffs[attempt - 1];
        logger.warn("graphql transport error, retrying", {
          attempt,
          maxAttempts,
          delay,
          error:
            err instanceof Error
              ? { name: err.name, message: err.message }
              : String(err),
        });
        await sleep(delay);
      }
    }

    // Unreachable: the loop either returns a response or throws.
    throw lastError;
  };
};

/**
 * Production wrapper bound to the module-load-time `baseFetch`. Use this
 * everywhere except in unit tests.
 */
export const graphqlFetchWithRetry: typeof fetch =
  makeGraphqlFetchWithRetry(baseFetch);

const sharedFetchConfig = { fetch: graphqlFetchWithRetry } as const;

/**
 * Used for generated requests
 * Returns an GraphQLClient to interact with GraphQL's API with a service token
 * @returns
 */
export const getAPIServiceGraphqlClient = async () => {
  return new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
    ...sharedFetchConfig,
    headers: {
      authorization: `Bearer ${await generateServiceJWT()}`,
    },
  });
};

/**
 * Used for generated requests
 * Returns an GraphQLClient to interact with GraphQL's API with a API Key token
 * @returns
 */
export const getAPIKeyGraphqlClient = async (params: { team_id: string }) => {
  return new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
    ...sharedFetchConfig,
    headers: {
      authorization: `Bearer ${await generateAPIKeyJWT(params.team_id)}`,
    },
  });
};

/**
 * Used for generated requests
 * Returns an GraphQLClient to interact with GraphQL's API with a reviewer token
 * See Documentation: https://www.notion.so/worldcoin/Reviewer-Role-Specification-5c43c442735842d7ae57e19823a962fb?pvs=4
 * @returns
 */
export const getAPIReviewerGraphqlClient = async () => {
  return new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
    ...sharedFetchConfig,
    headers: {
      authorization: `Bearer ${await generateReviewerJWT()}`,
    },
  });
};
