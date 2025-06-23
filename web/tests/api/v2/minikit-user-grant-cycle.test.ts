import { generateHashedSecret } from "@/api/helpers/utils";
import { GET } from "@/api/v2/minikit/user-grant-cycle";
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
  createSignedFetcher: () => signedFetch,
}));

// #endregion

// #region Test Data
const getUrl = (wallet_address?: string, required_app_id?: string) => {
  const params = new URLSearchParams();
  if (wallet_address) params.append("wallet_address", wallet_address);
  if (required_app_id) params.append("required_app_id", required_app_id);
  
  return new URL(
    `/api/v2/minikit/user-grant-cycle${params.toString() ? `?${params.toString()}` : ""}`,
    "http://localhost:3000",
  );
};

const createMockRequest = (params: {
  url: URL | RequestInfo;
  api_key?: string;
}) => {
  const { url, api_key } = params;
  const headers: HeadersInit = {
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
const validWalletAddress = "0x1234567890123456789012345678901234567890";
const validApiKey = `api_${apiKeyValue}`;

const mockSuccessResponse = {
  nextGrantClaimDate: "2024-12-31T23:59:59.999Z",
};

// #endregion

// #region Success cases tests
describe("/api/v2/minikit/user-grant-cycle [success cases]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns next grant claim date successfully", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validWalletAddress, validAppId),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
    signedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSuccessResponse,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toEqual({
      success: true,
      status: 200,
      result: {
        nextGrantClaimDate: mockSuccessResponse.nextGrantClaimDate,
      },
    });

    expect(signedFetch).toHaveBeenCalledWith(
      expect.stringContaining(`walletAddress=${validWalletAddress}&requiredAppId=${validAppId}`),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });
});
// #endregion

// #region Error cases tests
describe("/api/v2/minikit/user-grant-cycle [error cases]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 if wallet_address is missing", async () => {
    const mockReq = createMockRequest({
      url: getUrl(undefined, validAppId),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_request");
    expect(body.detail).toContain("wallet_address is required");
  });

  it("returns 400 if wallet_address is invalid length", async () => {
    const mockReq = createMockRequest({
      url: getUrl("0x123", validAppId),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_request");
    expect(body.detail).toContain("must be exactly 42 characters");
  });

  it("returns 400 if required_app_id is missing", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validWalletAddress, undefined),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("invalid_request");
    expect(body.detail).toContain("required_app_id is required");
  });

  it("returns 401 if API key is missing", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validWalletAddress, validAppId),
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await GET(mockReq);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("unauthorized");
    expect(body.detail).toBe("API key is required.");
  });

  it("returns 404 if API key not found", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validWalletAddress, validAppId),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue({ api_key_by_pk: null });

    const res = await GET(mockReq);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("not_found");
    expect(body.detail).toBe("API key not found.");
  });

  it("returns 400 if API key is inactive", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validWalletAddress, validAppId),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue({
      api_key_by_pk: {
        ...validApiKeyResponse.api_key_by_pk,
        is_active: false,
      },
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("api_key_inactive");
    expect(body.detail).toBe("API key is inactive.");
  });

  it("returns 403 if API key is not valid for app", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validWalletAddress, "app_different_app_id"),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await GET(mockReq);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("invalid_app");
    expect(body.detail).toBe("API key is not valid for this app.");
  });

  it("returns 400 for user_not_found_for_wallet_address error", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validWalletAddress, validAppId),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
    signedFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        code: "user_not_found_for_wallet_address",
        message: "User not found for the provided wallet address",
      }),
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("user_not_found_for_wallet_address");
    expect(body.detail).toBe("User not found for the provided wallet address");
  });

  it("returns 400 for app_not_installed error", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validWalletAddress, validAppId),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
    signedFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        code: "app_not_installed",
        message: "App is not installed for this user",
      }),
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("app_not_installed");
    expect(body.detail).toBe("App is not installed for this user");
  });

  it("returns 400 for no_active_grant_cycles error", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validWalletAddress, validAppId),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
    signedFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        code: "no_active_grant_cycles",
        message: "No active grant cycles found",
      }),
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("no_active_grant_cycles");
    expect(body.detail).toBe("No active grant cycles found");
  });

  it("returns original status code for unknown errors", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validWalletAddress, validAppId),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
    signedFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({
        code: "service_unavailable",
        message: "Service is temporarily unavailable",
      }),
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe("internal_api_error");
    expect(body.detail).toBe("Failed to fetch user grant cycle");
  });

  it("returns 500 on fetch exception", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validWalletAddress, validAppId),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
    signedFetch.mockRejectedValue(new Error("Network error"));

    const res = await GET(mockReq);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("internal_server_error");
    expect(body.detail).toBe("Failed to fetch user grant cycle");
  });
});
// #endregion