import { generateHashedSecret } from "@/api/helpers/utils";
import { GET } from "@/api/v2/minikit/userop/[user_op_hash]";
import { NextRequest } from "next/server";

const FetchAPIKey = jest.fn();

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

jest.mock("../../../api/helpers/temporal-rpc", () => ({
  getUserOperationReceipt: jest.fn(),
}));

const { getUserOperationReceipt: mockGetUserOperationReceipt } =
  jest.requireMock("../../../api/helpers/temporal-rpc") as {
    getUserOperationReceipt: jest.Mock;
  };

const getUrl = (userOpHash: string, app_id?: string) => {
  const search = app_id ? `?app_id=${app_id}` : "";
  return new URL(
    `/api/v2/minikit/userop/${userOpHash}${search}`,
    "http://localhost:3000",
  );
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

const validAppId = validApiKeyResponse.api_key_by_pk.team.apps[0].id;
const validUserOpHash =
  "0x8004b63530b968a2a2c9ff414e01fc06a3ec5e4068d36d923df6aa4334744369";
const uppercaseUserOpHash =
  "0x8004B63530B968A2A2C9FF414E01FC06A3EC5E4068D36D923DF6AA4334744369";
const validApiKey = `api_${apiKeyValue}`;

describe("/api/v2/minikit/userop/[user_op_hash]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
  });

  it("returns pending when the receipt is not available yet", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validUserOpHash, validAppId),
      api_key: validApiKey,
    });

    mockGetUserOperationReceipt.mockResolvedValue(null);

    const res = await GET(mockReq, {
      params: { user_op_hash: validUserOpHash },
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      status: "pending",
      userOpHash: validUserOpHash,
      sender: null,
      transaction_hash: null,
      nonce: null,
    });
  });

  it("accepts uppercase user operation hashes", async () => {
    const mockReq = createMockRequest({
      url: getUrl(uppercaseUserOpHash, validAppId),
      api_key: validApiKey,
    });

    mockGetUserOperationReceipt.mockResolvedValue(null);

    const res = await GET(mockReq, {
      params: { user_op_hash: uppercaseUserOpHash },
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      status: "pending",
      userOpHash: uppercaseUserOpHash,
      sender: null,
      transaction_hash: null,
      nonce: null,
    });
  });

  it("returns success with the transaction hash when a receipt exists", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validUserOpHash, validAppId),
      api_key: validApiKey,
    });

    mockGetUserOperationReceipt.mockResolvedValue({
      entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      userOpHash: validUserOpHash,
      success: true,
      sender: "0x1234567890123456789012345678901234567890",
      nonce: "0x2a",
      actualGasUsed: "0x7f550",
      actualGasCost: "0x4b3b147f788710",
      logs: [],
      receipt: {
        transactionHash:
          "0x1111111111111111111111111111111111111111111111111111111111111111",
        transactionIndex: "0x20",
        blockHash:
          "0xeaeec1eff4095bdcae44d86574cf1bf08b14b26be571b7c2290f32f9f250c103",
        blockNumber: "0x31de70e",
        from: "0x43370996A3Aff7B66B3AC7676dD973d01Ecec039",
        to: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        cumulativeGasUsed: "0x4724c3",
        gasUsed: "0x7ff5a",
        contractAddress: null,
        logs: [],
        logsBloom:
          "0x010004000800020000000040000000000000040000000000000010000004000000080000001000000212841100000000041080000000000020000240000000000800000022001000400000080000028000040000000000200001000010000000000000000a0000000000000000800800000000004110004080800110282000000000000002000000000000000000000000000200000400000000000000240040200002000000000000400000000002000140000000000000000002200000004000000002000000000021000000000000000000000000800080108020000020000000080000000000000000000000000000000000000000000108000000102000",
        status: "0x1",
        effectiveGasPrice: "0x89b098f46",
      },
    });

    const res = await GET(mockReq, {
      params: { user_op_hash: validUserOpHash },
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      status: "success",
      userOpHash: validUserOpHash,
      sender: "0x1234567890123456789012345678901234567890",
      transaction_hash:
        "0x1111111111111111111111111111111111111111111111111111111111111111",
      nonce: "0x2a",
    });
  });

  it("returns failed when the receipt indicates failure", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validUserOpHash, validAppId),
      api_key: validApiKey,
    });

    mockGetUserOperationReceipt.mockResolvedValue({
      entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      userOpHash: validUserOpHash,
      success: false,
      sender: "0x1234567890123456789012345678901234567890",
      nonce: "0x2a",
      actualGasUsed: "0x7f550",
      actualGasCost: "0x4b3b147f788710",
      logs: [],
      receipt: {
        transactionHash:
          "0x2222222222222222222222222222222222222222222222222222222222222222",
        transactionIndex: "0x20",
        blockHash:
          "0xeaeec1eff4095bdcae44d86574cf1bf08b14b26be571b7c2290f32f9f250c103",
        blockNumber: "0x31de70e",
        from: "0x43370996A3Aff7B66B3AC7676dD973d01Ecec039",
        to: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
        cumulativeGasUsed: "0x4724c3",
        gasUsed: "0x7ff5a",
        contractAddress: null,
        logs: [],
        logsBloom:
          "0x010004000800020000000040000000000000040000000000000010000004000000080000001000000212841100000000041080000000000020000240000000000800000022001000400000080000028000040000000000200001000010000000000000000a0000000000000000800800000000004110004080800110282000000000000002000000000000000000000000000200000400000000000000240040200002000000000000400000000002000140000000000000000002200000004000000002000000000021000000000000000000000000800080108020000020000000080000000000000000000000000000000000000000000108000000102000",
        status: "0x0",
        effectiveGasPrice: "0x89b098f46",
      },
    });

    const res = await GET(mockReq, {
      params: { user_op_hash: validUserOpHash },
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      status: "failed",
      userOpHash: validUserOpHash,
      sender: "0x1234567890123456789012345678901234567890",
      transaction_hash:
        "0x2222222222222222222222222222222222222222222222222222222222222222",
      nonce: "0x2a",
    });
  });

  it("returns 400 for an invalid user operation hash", async () => {
    const mockReq = createMockRequest({
      url: getUrl("invalid-hash", validAppId),
      api_key: validApiKey,
    });

    const res = await GET(mockReq, {
      params: { user_op_hash: "invalid-hash" },
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      code: "invalid_parameter",
      attribute: "user_op_hash",
    });
  });

  it("returns 401 when the API key is missing", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validUserOpHash, validAppId),
    });

    const res = await GET(mockReq, {
      params: { user_op_hash: validUserOpHash },
    });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      code: "unauthorized",
    });
  });
});
