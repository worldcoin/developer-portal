import { GET } from "@/api/v2/minikit/transaction/[transaction_id]";
import { generateHashedSecret } from "@/legacy/backend/utils";
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

jest.mock(
  "../../../api/v2/minikit/transaction/[transaction_id]/graphql/fetch-api-key.generated",
  () => ({
    getSdk: () => ({
      FetchAPIKey,
    }),
  }),
);

jest.mock("aws-sigv4-fetch", () => ({
  createSignedFetcher: () =>
    jest.fn(() =>
      Promise.resolve({
        json: () => ({ result: { transactions: [transaction] } }),
        ok: true,
        status: 200,
      }),
    ),
}));

const transaction = {
  transactionId: "txn_123456789",
  transactionHash: "0xabc123def456",
  transactionStatus: "completed",
  referenceId: "ref_987654321",
  miniappId: "miniapp_001",
  updatedAt: new Date().toISOString(),
  network: "optimism",
  fromWalletAddress: "0x123456789abcdef",
  recipientAddress: "0x987654321fedcba",
  inputToken: "USDC",
  inputTokenAmount: "15000000",
};

// #endregion

// #region Test Data
const getUrl = (transaction_id: string, app_id?: string) => {
  if (!app_id) {
    return new URL(
      `/api/v2/minikit/transaction/${transaction_id}`,
      "http://localhost:3000",
    );
  }
  return new URL(
    `/api/v2/minikit/transaction/${transaction_id}?app_id=${app_id}`,
    "http://localhost:3000",
  );
};

const createMockRequest = (params: {
  url: URL | RequestInfo;
  api_key: string;
}) => {
  const { url, api_key } = params;
  return new NextRequest(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api_key}`,
    },
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
      apps: [{ id: "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a" }],
    },
  },
};

const validAppId = validApiKeyResponse.api_key_by_pk.team.apps[0].id;
const validTransactionId = "transaction_123";
const validApiKey = `api_${apiKeyValue}`;

// #endregion

// #region Success cases tests
describe("/api/v2/minikit/transaction/transaction_id [success cases]", () => {
  it("can fetch a transaction", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validTransactionId, validAppId),
      api_key: validApiKey,
    });

    const ctx = { params: { transaction_id: validTransactionId } };
    FetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await GET(mockReq, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toEqual(transaction);
  });
});
// #endregion

// #region Error cases tests
describe("/api/v2/minikit/transaction/transaction_id [error cases]", () => {
  it("returns 401 if no api key is provided", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validTransactionId, validAppId),
      api_key: "",
    });

    const ctx = { params: { transaction_id: validTransactionId } };
    FetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await GET(mockReq, ctx);
    expect(res.status).toBe(401);
  });

  it("returns 404 if api key not exists", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validTransactionId, validAppId),
      api_key: (Math.random() * 10 ** 10).toFixed(),
    });

    const ctx = { params: { transaction_id: validTransactionId } };
    FetchAPIKey.mockResolvedValue({});

    const res = await GET(mockReq, ctx);
    expect(res.status).toBe(404);
  });

  it("returns 403 if token is invalid or old", async () => {
    const testHashedSecretLocal = generateHashedSecret("app_123");

    const apiKeyValueLocal = Buffer.from(
      `${"app_123"}:${testHashedSecretLocal.secret}`,
    )
      .toString("base64")
      .replace(/=/g, "");

    const mockReq = createMockRequest({
      url: getUrl(validTransactionId, validAppId),
      api_key: `api_${apiKeyValueLocal}`,
    });

    const ctx = { params: { transaction_id: validTransactionId } };
    FetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await GET(mockReq, ctx);
    expect(res.status).toBe(403);
  });

  it("returns 403 if api key is not valid for the app", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validTransactionId, "app_1234"),
      api_key: validApiKey,
    });

    const ctx = { params: { transaction_id: validTransactionId } };
    FetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await GET(mockReq, ctx);
    expect(res.status).toBe(403);
  });

  it("returns 400 if api key is inactive", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validTransactionId, validAppId),
      api_key: validApiKey,
    });

    const ctx = { params: { transaction_id: validTransactionId } };
    FetchAPIKey.mockResolvedValue({
      ...validApiKeyResponse,
      api_key_by_pk: { ...validApiKeyResponse.api_key_by_pk, is_active: false },
    });

    const res = await GET(mockReq, ctx);
    expect(res.status).toBe(400);
  });

  it("returns 400 if appId is not provided", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validTransactionId),
      api_key: validApiKey,
    });

    const ctx = { params: { transaction_id: validTransactionId } };
    FetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await GET(mockReq, ctx);
    expect(res.status).toBe(400);
  });

  it("returns 400 if appId is empty", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validTransactionId, ""),
      api_key: validApiKey,
    });

    const ctx = { params: { transaction_id: validTransactionId } };
    FetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await GET(mockReq, ctx);
    expect(res.status).toBe(400);
  });
});
// #endregion
