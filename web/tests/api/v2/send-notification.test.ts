import { generateHashedSecret } from "@/api/helpers/utils";
import { POST } from "@/api/v2/minikit/send-notification";
import { NextRequest } from "next/server";

// #region Mocks
const FetchAPIKey = jest.fn();
const GetAppMetadata = jest.fn();

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("@/api/v2/minikit/graphql/fetch-api-key.generated", () => ({
  getSdk: () => ({
    FetchAPIKey,
  }),
}));

jest.mock(
  "@/api/v2/minikit/send-notification/graphql/fetch-metadata.generated",
  () => ({
    getSdk: () => ({
      GetAppMetadata,
    }),
  }),
);

jest.mock(
  "@/api/v2/minikit/send-notification/graphql/create-notification-log.generated",
  () => ({
    getSdk: () => ({
      CreateNotificationLog: jest.fn(),
      CreateWalletAdressNotificationLogs: jest.fn(),
    }),
  }),
);

jest.mock("aws-sigv4-fetch", () => ({
  createSignedFetcher: () =>
    jest.fn(() =>
      Promise.resolve({
        json: () => ({
          result: {
            results: [
              {
                walletAddress:
                  "0x0000000000000000000000000000000000000000abcdef1234567890abcdef12345678",
                sent: true,
                reason: "User has disabled notifications",
              },
            ],
          },
        }),
        ok: true,
        status: 201,
      }),
    ),
}));

const createMockRequest = (params: {
  url: URL | RequestInfo;
  api_key: string;
}) => {
  const { url, api_key } = params;
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api_key}`,
    },
    body: JSON.stringify({
      app_id: "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
      wallet_addresses: ["0x0000000000000000000000000000000000000000"],
      title: "Test Notification",
      message: "This is a test notification",
      mini_app_path:
        "worldapp://mini-app?app_id=app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
    }),
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

const validAppMetadata = {
  app_metadata: [
    {
      name: "Example App",
      app_id: "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
      is_reviewer_app_store_approved: true,
      verification_status: "verified",
      app: {
        team: {
          id: "team_dd2ecd36c6c45f645e8e5d9a31abdee1",
        },
      },
    },
  ],
};

const validApiKey = `api_${apiKeyValue}`;

// #endregion

// #region Success cases tests
describe("/api/v2/minikit/send-notification [success cases]", () => {
  beforeEach(async () => {
    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
    GetAppMetadata.mockResolvedValue(validAppMetadata);
    await global.RedisClient?.flushall();
  });

  it("can send a notification", async () => {
    const mockReq = createMockRequest({
      url: "http://localhost:3000/api/v2/minikit/send-notification",
      api_key: validApiKey,
    });

    const res = await POST(mockReq);
    expect(res.status).toBe(200);
  });
});
// #endregion

// #region Error cases tests
describe("/api/v2/minikit/send-notification [error cases]", () => {
  beforeEach(async () => {
    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
    GetAppMetadata.mockResolvedValue(validAppMetadata);
    await global.RedisClient?.flushall();
  });

  it("returns 401 if no api key is provided", async () => {
    const mockReq = createMockRequest({
      url: "http://localhost:3000/api/v2/minikit/send-notification",
      api_key: "",
    });

    const res = await POST(mockReq);
    expect(res.status).toBe(401);
    expect((await res.json()).detail).toBe("API key is required.");
  });

  it("returns 400 if message is too long", async () => {
    const mockReq = new NextRequest(
      "http://localhost:3000/api/v2/minikit/send-notification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          app_id: "random",
          wallet_addresses: ["0x0000000000000000000000000000000000000000"],
          title: "Test Notification",
          message: "a" + "bet".repeat(200),
          mini_app_path: "worldapp://mini-app?app_id=random",
        }),
      },
    );

    const res = await POST(mockReq);
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toBe(
      "message must be at most 200 characters",
    );
  });

  it("returns 404 if api key not exists", async () => {
    const mockReq = createMockRequest({
      url: "http://localhost:3000/api/v2/minikit/send-notification",
      api_key: "random",
    });

    FetchAPIKey.mockResolvedValue({});

    const res = await POST(mockReq);
    expect(res.status).toBe(404);
    expect((await res.json()).detail).toBe("API key not found.");
  });

  it("returns 403 if token is invalid or old", async () => {
    const testHashedSecretLocal = generateHashedSecret("app_123");

    const apiKeyValueLocal = Buffer.from(
      `${"app_123"}:${testHashedSecretLocal.secret}`,
    )
      .toString("base64")
      .replace(/=/g, "");

    const mockReq = createMockRequest({
      url: "http://localhost:3000/api/v2/minikit/send-notification",
      api_key: `api_${apiKeyValueLocal}`,
    });

    const res = await POST(mockReq);
    expect(res.status).toBe(403);
    expect((await res.json()).detail).toBe("API key is not valid.");
  });

  it("returns 403 if api key is not valid for the app", async () => {
    const mockReq = new NextRequest(
      "http://localhost:3000/api/v2/minikit/send-notification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          app_id: "random",
          wallet_addresses: ["0x0000000000000000000000000000000000000000"],
          title: "Test Notification",
          message: "This is a test notification",
          mini_app_path: "worldapp://mini-app?app_id=random",
        }),
      },
    );

    const res = await POST(mockReq);
    expect(res.status).toBe(403);
    expect((await res.json()).detail).toBe(
      "API key is not valid for this app.",
    );
  });

  it("returns 400 if api key is inactive", async () => {
    const mockReq = createMockRequest({
      url: "http://localhost:3000/api/v2/minikit/send-notification",
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue({
      api_key_by_pk: { ...validApiKeyResponse.api_key_by_pk, is_active: false },
    });

    const res = await POST(mockReq);
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toBe("API key is inactive.");
  });

  it("returns 400 if not allowed to send notifications", async () => {
    const mockReq = createMockRequest({
      url: "http://localhost:3000/api/v2/minikit/send-notification",
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
    GetAppMetadata.mockResolvedValue({
      app_metadata: [
        {
          name: "Example App",
          app_id: "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
          is_reviewer_app_store_approved: true,
          is_allowed_unlimited_notifications: false,
          max_notifications_per_day: 0,
          verification_status: "unverified",
          app: { team: { id: "random" } },
        },
      ],
    });

    const res = await POST(mockReq);
    expect(res.status).toBe(400);
    expect((await res.json()).detail).toBe(
      "Notifications not enabled for this app",
    );
  });

  it("returns 400 if unverified app limit reached", async () => {
    // Mock the API key lookup
    FetchAPIKey.mockResolvedValue(validApiKeyResponse);

    // Mock the app metadata to simulate an unverified app
    GetAppMetadata.mockResolvedValue({
      app_metadata: [
        {
          name: "Example App",
          app_id: "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
          is_reviewer_app_store_approved: true,
          verification_status: "unverified",
          app: {
            team: {
              id: "team_dd2ecd36c6c45f645e8e5d9a31abdee1",
            },
          },
        },
      ],
    });

    const mockReq = new NextRequest(
      "http://localhost:3000/api/v2/minikit/send-notification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          app_id: "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
          wallet_addresses: [
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
          ],
          title: "Test Notification",
          message: "This is a test notification",
          mini_app_path:
            "worldapp://mini-app?app_id=app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
        }),
      },
    );

    const res = await POST(mockReq);
    expect(res.status).toBe(200);

    const mockReq2 = new NextRequest(
      "http://localhost:3000/api/v2/minikit/send-notification",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validApiKey}`,
        },
        body: JSON.stringify({
          app_id: "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
          wallet_addresses: ["0x0000000000000000000000000000000000000000"],
          title: "Test Notification",
          message: "This is a test notification",
          mini_app_path:
            "worldapp://mini-app?app_id=app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
        }),
      },
    );

    const res2 = await POST(mockReq2);
    expect(res2.status).toBe(400);
    expect((await res2.json()).detail).toBe("Unverified app limit reached");
  });
});
// #endregion
