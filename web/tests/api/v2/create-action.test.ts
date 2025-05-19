import { generateHashedSecret } from "@/api/helpers/utils";
import { POST } from "@/api/v2/create-action";
import { NextRequest } from "next/server";

// #region Mocks
const VerifyFetchAPIKey = jest.fn();
const CreateDynamicAction = jest.fn();

jest.mock("../../../lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock(
  "../../../api/v2/create-action/graphql/fetch-api-key.generated",
  () => ({
    getSdk: () => ({
      VerifyFetchAPIKey,
    }),
  }),
);

jest.mock(
  "../../../api/v2/create-action/graphql/create-dynamic-action.generated",
  () => ({
    getSdk: () => ({
      CreateDynamicAction,
    }),
  }),
);
// #endregion

// #region Test Data
const getUrl = (app_id: string) =>
  new URL(`/api/v2/create-action/${app_id}`, "http://localhost:3000");

const createMockRequest = (params: {
  url: URL | RequestInfo;
  api_key: string;
  body: Record<string, any>;
}) => {
  const { url, api_key, body } = params;
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `ApiKey ${api_key}`,
    },
    body: JSON.stringify(body),
  });
};

const validBody = {
  action: "test-action",
  name: "test-name",
  description: "test-description",
  max_verifications: 1,
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
const validApiKey = `api_${apiKeyValue}`;
// #endregion

// #region Success cases tests
describe("/api/v2/create-action [success cases]", () => {
  it("can create a new action with action only", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
      body: { action: validBody.action },
    });

    const ctx = { params: { app_id: validAppId } };
    VerifyFetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const actionResult = {
      id: "action_123",
      action: validBody.action,
      name: "",
      description: "",
      max_verifications: 1,
    };

    CreateDynamicAction.mockResolvedValue({
      insert_action_one: actionResult,
    });

    const res = await POST(mockReq, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toEqual({
      action: actionResult,
    });
  });

  it("can create a new action with full set of body params", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
      body: validBody,
    });

    const ctx = { params: { app_id: validAppId } };
    VerifyFetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const actionResult = {
      id: "action_123",
      action: validBody.action,
      name: validBody.name,
      description: validBody.description,
      max_verifications: validBody.max_verifications,
    };

    CreateDynamicAction.mockResolvedValue({
      insert_action_one: actionResult,
    });

    const res = await POST(mockReq, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toEqual({
      action: actionResult,
    });
  });
});
// #endregion

// #region Error cases tests
describe("/api/v2/create-action [error cases]", () => {
  it("returns 401 if no api key is provided", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: "",
      body: validBody,
    });

    const ctx = { params: { app_id: validAppId } };
    VerifyFetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await POST(mockReq, ctx);
    expect(res.status).toBe(401);
  });

  it("returns 404 if api key not exists", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: (Math.random() * 10 ** 10).toFixed(),
      body: validBody,
    });

    const ctx = { params: { app_id: validAppId } };
    VerifyFetchAPIKey.mockResolvedValue({});

    const res = await POST(mockReq, ctx);
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
      url: getUrl(validAppId),
      api_key: `api_${apiKeyValueLocal}`,
      body: validBody,
    });

    const ctx = { params: { app_id: validAppId } };
    VerifyFetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await POST(mockReq, ctx);
    expect(res.status).toBe(403);
  });

  it("returns 403 if api key is not valid for the app", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
      body: validBody,
    });

    const ctx = { params: { app_id: "app_123" } };
    VerifyFetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await POST(mockReq, ctx);
    expect(res.status).toBe(403);
  });

  it("returns 400 if api key is inactive", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
      body: validBody,
    });

    const ctx = { params: { app_id: validAppId } };
    VerifyFetchAPIKey.mockResolvedValue({
      ...validApiKeyResponse,
      api_key_by_pk: { ...validApiKeyResponse.api_key_by_pk, is_active: false },
    });

    const res = await POST(mockReq, ctx);
    expect(res.status).toBe(400);
  });

  it("returns 400 if action is not provided", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
      body: {},
    });

    const ctx = { params: { app_id: validAppId } };
    VerifyFetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await POST(mockReq, ctx);
    expect(res.status).toBe(400);
  });

  it("returns 400 if action is empty", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
      body: { action: "" },
    });

    const ctx = { params: { app_id: validAppId } };
    VerifyFetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await POST(mockReq, ctx);
    expect(res.status).toBe(400);
  });
});
// #endregion
