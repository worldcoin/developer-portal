import { generateHashedSecret } from "@/api/helpers/utils";
import { GET } from "@/api/v2/minikit/transaction/debug";
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

const mockDebugResponse = {
  result: {
    transactions: [
      {
        debugUrl: "https://dashboard.tenderly.co/tx/...",
        createdAt: "2024-03-21T10:30:00.000Z",
        block: 12345678,
        simulationRequestId: "sim_abc123def456",
        simulationError: "Permit signature expired",
        walletAddress: "0x1234...",
      },
    ],
  },
};

// #endregion

// #region Test Data
const getUrl = (app_id?: string) => {
  if (!app_id) {
    return new URL(
      "/api/v2/minikit/transaction/debug",
      "http://localhost:3000",
    );
  }
  return new URL(
    `/api/v2/minikit/transaction/debug?app_id=${app_id}`,
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
const validApiKey = `api_${apiKeyValue}`;

// #endregion

// #region Success cases tests
describe("/api/v2/minikit/transaction/debug [success cases]", () => {
  beforeEach(() => {
    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
    signedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockDebugResponse),
    });
  });

  it("can fetch debug URLs", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toEqual(mockDebugResponse.result);
    expect(signedFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        `/miniapp-actions/debug?miniapp-id=${validAppId}`,
      ),
      expect.any(Object),
    );
  });
});

// #endregion

// #region Error cases tests
describe("/api/v2/minikit/transaction/debug [error cases]", () => {
  beforeEach(() => {
    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
  });

  it("returns 401 if API key is missing", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe("unauthorized");
  });

  it("returns 404 if API key is not found", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue({ api_key_by_pk: null });

    const res = await GET(mockReq);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("not_found");
  });

  it("returns 400 if API key is inactive", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
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
  });

  it("returns 400 if app_id is missing", async () => {
    const mockReq = createMockRequest({
      url: getUrl(),
      api_key: validApiKey,
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("validation_error");
  });

  it("returns 404 if no debug URLs are available", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
    });

    signedFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ transactions: [] }),
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe("debug_url_not_available");
  });

  it("returns 500 if backend request fails", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
    });

    signedFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal server error"),
    });

    const res = await GET(mockReq);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.code).toBe("internal_api_error");
  });
});
// #endregion
