import { generateHashedSecret } from "@/api/helpers/utils";
import { GET } from "@/api/v2/minikit/transactions";
import { NextRequest } from "next/server";

// #region Mocks
const FetchAPIKey = jest.fn();
const signedFetch = jest.fn();

jest.mock("../../../lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("../../../api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("../../../api/v2/minikit/graphql/fetch-api-key.generated", () => ({
  getSdk: () => ({
    FetchAPIKey,
  }),
}));

jest.mock("aws-sigv4-fetch", () => ({
  createSignedFetcher: () => signedFetch,
}));

const makeTransaction = (updatedAt: string, overrides = {}) => ({
  transactionId: "txn_abc123",
  transactionHash: "0xabc123def456",
  transactionStatus: "mined",
  miniappId: "app_9cdd0a714aec9ed17dca660bc9ffe72a",
  updatedAt,
  network: "optimism",
  fromWalletAddress: "0x1234567890abcdef",
  toContractAddress: "0xfedcba9876543210",
  ...overrides,
});

const mockTransactionsResponse = {
  result: {
    transactions: [
      makeTransaction("2024-03-21T10:00:00.000Z", { transactionId: "txn_1" }),
      makeTransaction("2024-03-21T12:00:00.000Z", { transactionId: "txn_2" }),
      makeTransaction("2024-03-21T11:00:00.000Z", { transactionId: "txn_3" }),
    ],
  },
};

// #endregion

// #region Test Data
const getUrl = (params: { mini_app_id?: string; limit?: number } = {}) => {
  const url = new URL("/api/v2/minikit/transactions", "http://localhost:3000");
  if (params.mini_app_id)
    url.searchParams.set("mini_app_id", params.mini_app_id);
  if (params.limit !== undefined)
    url.searchParams.set("limit", String(params.limit));
  return url;
};

const createMockRequest = (params: {
  url: URL | RequestInfo;
  api_key?: string;
}) => {
  const { url, api_key } = params;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (api_key) {
    headers.Authorization = `Bearer ${api_key}`;
  }
  return new NextRequest(url, {
    method: "GET",
    headers,
  });
};

const validApiKeyId = "key_667f5fbd4ad943622b4b2d3eb258f89c";
const testHashedSecret = generateHashedSecret(validApiKeyId);

const apiKeyValue = Buffer.from(`${validApiKeyId}:${testHashedSecret.secret}`)
  .toString("base64")
  .replace(/=/g, "");

const validApiKeyResponse = {
  api_key_by_pk: {
    id: validApiKeyId,
    api_key: testHashedSecret.hashed_secret,
    is_active: true,
    team: {
      id: "team_dd2ecd36c6c45f645e8e5d9a31abdee1",
      apps: [{ id: "app_9cdd0a714aec9ed17dca660bc9ffe72a" }],
    },
  },
};

const validMiniAppId = validApiKeyResponse.api_key_by_pk.team.apps[0].id;
const validApiKey = `api_${apiKeyValue}`;

// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  FetchAPIKey.mockResolvedValue(validApiKeyResponse);
  signedFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(mockTransactionsResponse),
  });
});

// #region Success cases
describe("/api/v2/minikit/transactions [success cases]", () => {
  it("returns the 25 most recent transactions by default", async () => {
    const mockReq = createMockRequest({
      url: getUrl({ mini_app_id: validMiniAppId }),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(200);
    const body = await res.json();

    // Transactions should be sorted newest-first
    expect(body.transactions[0].transactionId).toBe("txn_2");
    expect(body.transactions[1].transactionId).toBe("txn_3");
    expect(body.transactions[2].transactionId).toBe("txn_1");
  });

  it("calls the backend with correct miniapp-id and limit", async () => {
    const mockReq = createMockRequest({
      url: getUrl({ mini_app_id: validMiniAppId }),
      api_key: validApiKey,
    });

    await GET(mockReq);

    expect(signedFetch).toHaveBeenCalledWith(
      expect.stringContaining(`miniapp-id=${validMiniAppId}&limit=25`),
      expect.any(Object),
    );
  });

  it("respects a custom limit", async () => {
    // Build 30 transactions to confirm slicing
    const manyTransactions = Array.from({ length: 30 }, (_, i) =>
      makeTransaction(new Date(2024, 0, i + 1).toISOString(), {
        transactionId: `txn_${i}`,
      }),
    );
    signedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({ result: { transactions: manyTransactions } }),
    });

    const mockReq = createMockRequest({
      url: getUrl({ mini_app_id: validMiniAppId, limit: 10 }),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.transactions).toHaveLength(10);

    expect(signedFetch).toHaveBeenCalledWith(
      expect.stringContaining("limit=10"),
      expect.any(Object),
    );
  });

  it("returns an empty array when the backend has no transactions", async () => {
    signedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ result: { transactions: [] } }),
    });

    const mockReq = createMockRequest({
      url: getUrl({ mini_app_id: validMiniAppId }),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.transactions).toEqual([]);
  });
});
// #endregion

// #region Error cases
describe("/api/v2/minikit/transactions [error cases]", () => {
  it("returns 401 if the API key is missing", async () => {
    const mockReq = createMockRequest({
      url: getUrl({ mini_app_id: validMiniAppId }),
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("unauthorized");
  });

  it("returns 400 if mini_app_id is missing", async () => {
    const mockReq = createMockRequest({
      url: getUrl(),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("validation_error");
  });

  it("returns 400 if limit exceeds 100", async () => {
    const mockReq = createMockRequest({
      url: getUrl({ mini_app_id: validMiniAppId, limit: 101 }),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("validation_error");
  });

  it("returns 404 if the API key is not found", async () => {
    FetchAPIKey.mockResolvedValueOnce({ api_key_by_pk: null });

    const mockReq = createMockRequest({
      url: getUrl({ mini_app_id: validMiniAppId }),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("not_found");
  });

  it("returns 400 if the API key is inactive", async () => {
    FetchAPIKey.mockResolvedValueOnce({
      api_key_by_pk: {
        ...validApiKeyResponse.api_key_by_pk,
        is_active: false,
      },
    });

    const mockReq = createMockRequest({
      url: getUrl({ mini_app_id: validMiniAppId }),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("api_key_inactive");
  });

  it("returns 403 if the API key does not belong to the app", async () => {
    FetchAPIKey.mockResolvedValueOnce({
      api_key_by_pk: {
        ...validApiKeyResponse.api_key_by_pk,
        team: {
          ...validApiKeyResponse.api_key_by_pk.team,
          apps: [{ id: "app_differentapp00000000000000000" }],
        },
      },
    });

    const mockReq = createMockRequest({
      url: getUrl({ mini_app_id: validMiniAppId }),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("invalid_app");
  });

  it("returns 403 if the API key secret is wrong", async () => {
    const badApiKey = `api_${Buffer.from(`${validApiKeyId}:wrongsecret`).toString("base64").replace(/=/g, "")}`;

    const mockReq = createMockRequest({
      url: getUrl({ mini_app_id: validMiniAppId }),
      api_key: badApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("invalid_api_key");
  });

  it("returns 500 if the backend request fails", async () => {
    signedFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal server error"),
    });

    const mockReq = createMockRequest({
      url: getUrl({ mini_app_id: validMiniAppId }),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("internal_api_error");
  });
});
// #endregion
