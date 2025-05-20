import { generateHashedSecret } from "@/api/helpers/utils";
import { GET } from "@/api/v2/minikit/transaction/[transaction_id]";
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

jest.mock("../../../api/v2/minikit/graphql/fetch-api-key.generated", () => ({
  getSdk: () => ({
    FetchAPIKey,
  }),
}));

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
// TODO: Fix these tests and remove API KEY
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

const validAppId = validApiKeyResponse.api_key_by_pk.team.apps[0].id;
const validTransactionId =
  "0x8004b63530b968a2a2c9ff414e01fc06a3ec5e4068d36d923df6aa4334744369";
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
