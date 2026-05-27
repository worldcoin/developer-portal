// #region Mocks
jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Avoid touching `server-only` and the JWT helpers that pull in KMS in tests.
jest.mock("server-only", () => ({}));
jest.mock("@/api/helpers/jwts", () => ({
  generateServiceJWT: jest.fn(),
  generateAPIKeyJWT: jest.fn(),
  generateReviewerJWT: jest.fn(),
}));
// #endregion

import {
  graphqlFetchWithRetry,
  isRetryableOperation,
} from "@/api/helpers/graphql";

// #region Test data
const QUERY_BODY = JSON.stringify({
  query: "query GetThing { thing { id } }",
  variables: {},
  operationName: "GetThing",
});
const MUTATION_BODY = JSON.stringify({
  query: "mutation Update($id: ID!) { update(id: $id) { id } }",
  variables: { id: "1" },
  operationName: "Update",
});
const BATCH_BODY = JSON.stringify([
  { query: "query A { a }" },
  { query: "mutation B { b }" },
]);

const transportError = (code = "ECONNRESET") => {
  const e = new TypeError("fetch failed");
  (e as { cause?: unknown }).cause = Object.assign(new Error("socket"), {
    code,
  });
  return e;
};
// #endregion

describe("isRetryableOperation", () => {
  it("returns true for a query operation", () => {
    expect(isRetryableOperation(QUERY_BODY)).toBe(true);
  });

  it("returns false for a mutation operation", () => {
    expect(isRetryableOperation(MUTATION_BODY)).toBe(false);
  });

  it("returns false for a batch request (mixed ops)", () => {
    expect(isRetryableOperation(BATCH_BODY)).toBe(false);
  });

  it("returns false when the document has a mutation among multiple ops", () => {
    const body = JSON.stringify({
      query: "query A { a } mutation B($x: Int!) { update(x: $x) { id } }",
    });
    expect(isRetryableOperation(body)).toBe(false);
  });

  it("returns false for invalid GraphQL", () => {
    expect(
      isRetryableOperation(JSON.stringify({ query: "{ this is bad" })),
    ).toBe(false);
  });

  it("returns false for non-string body and missing body", () => {
    expect(isRetryableOperation(null)).toBe(false);
    expect(isRetryableOperation(undefined)).toBe(false);
    expect(isRetryableOperation("")).toBe(false);
    expect(isRetryableOperation(new Uint8Array() as unknown as BodyInit)).toBe(
      false,
    );
  });
});

describe("graphqlFetchWithRetry", () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const okResponse = () =>
    new Response(JSON.stringify({ data: {} }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  it("returns the response on first success (query)", async () => {
    fetchMock.mockResolvedValueOnce(okResponse());
    const res = await graphqlFetchWithRetry("https://example.test/v1/graphql", {
      method: "POST",
      body: QUERY_BODY,
    });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a query on transport error and succeeds", async () => {
    fetchMock
      .mockRejectedValueOnce(transportError("ECONNRESET"))
      .mockRejectedValueOnce(transportError("ETIMEDOUT"))
      .mockResolvedValueOnce(okResponse());

    const res = await graphqlFetchWithRetry("https://example.test/v1/graphql", {
      method: "POST",
      body: QUERY_BODY,
    });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("gives up after 3 attempts on persistent transport error (query)", async () => {
    fetchMock.mockRejectedValue(transportError("ECONNRESET"));
    await expect(
      graphqlFetchWithRetry("https://example.test/v1/graphql", {
        method: "POST",
        body: QUERY_BODY,
      }),
    ).rejects.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does NOT retry a mutation, even on transport error", async () => {
    fetchMock.mockRejectedValueOnce(transportError("ECONNRESET"));
    await expect(
      graphqlFetchWithRetry("https://example.test/v1/graphql", {
        method: "POST",
        body: MUTATION_BODY,
      }),
    ).rejects.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on a 5xx HTTP response (fetch resolved, didn't throw)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("upstream blew up", { status: 502 }),
    );
    const res = await graphqlFetchWithRetry("https://example.test/v1/graphql", {
      method: "POST",
      body: QUERY_BODY,
    });
    expect(res.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on a non-transport error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("unexpected sync failure"));
    await expect(
      graphqlFetchWithRetry("https://example.test/v1/graphql", {
        method: "POST",
        body: QUERY_BODY,
      }),
    ).rejects.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("passes an AbortSignal through to fetch on every attempt", async () => {
    fetchMock
      .mockRejectedValueOnce(transportError())
      .mockResolvedValueOnce(okResponse());

    await graphqlFetchWithRetry("https://example.test/v1/graphql", {
      method: "POST",
      body: QUERY_BODY,
    });
    for (const call of fetchMock.mock.calls) {
      const init = call[1] as RequestInit;
      expect(init.signal).toBeDefined();
      expect(init.signal).toBeInstanceOf(AbortSignal);
    }
  });
});
