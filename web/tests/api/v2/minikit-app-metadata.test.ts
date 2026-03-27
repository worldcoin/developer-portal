import { generateHashedSecret } from "@/api/helpers/utils";
import { GET } from "@/api/v2/minikit/app-metadata/[app_id]";
import { NextRequest } from "next/server";

// #region Mocks
const FetchAPIKey = jest.fn();
const GetAppMetadata = jest.fn();

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

jest.mock(
  "../../../api/v2/minikit/app-metadata/[app_id]/graphql/get-app-metadata.generated",
  () => ({
    getSdk: () => ({
      GetAppMetadata,
    }),
  }),
);

// #endregion

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

const validAppMetadataResponse = [
  {
    name: "test",
    app_id: "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
    logo_img_url: "",
    meta_tag_image_url: "",
    showcase_img_urls: null,
    hero_image_url: "",
    world_app_description: "Random Values",
    world_app_button_text: "Use Integration",
    whitelisted_addresses: null,
    app_mode: "external",
    description:
      '{"description_overview":"Random values","description_how_it_works":"Random values","description_connect":"test"}',
    category: "Social",
    integration_url: "https://github.com",
    app_website_url: "",
    source_code_url: "",
    support_link: "mailto:test@test.com",
    supported_countries: ["us"],
    supported_languages: ["en"],
    associated_domains: ["https://world.org"],
    is_allowed_unlimited_notifications: false,
    app: { team: { name: "test" }, rating_sum: 10, rating_count: 3 },
  },
];

const validAppId = validApiKeyResponse.api_key_by_pk.team.apps[0].id;
const validApiKey = `api_${apiKeyValue}`;

// #endregion

const app_metadata = {
  name: "test",
  app_id: "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
  logo_img_url: null,
  meta_tag_image_url: null,
  short_name: "test",
  showcase_img_urls: null,
  hero_image_url: null,
  content_card_image_url: "",
  world_app_description: "Random Values",
  world_app_button_text: "Use Integration",
  whitelisted_addresses: null,
  app_mode: "external",
  description: {
    overview: "Random values",
    how_it_works: "",
    how_to_connect: "",
  },
  category: {
    id: "social",
    name: "Social",
  },
  ratings_external_nullifier:
    "0x00d71e72b03eabb446f12650edb5cda22a932cada51bb0a16e0d5ce0ebc09965",
  integration_url: "https://github.com",
  app_website_url: "",
  source_code_url: "",
  support_link: "mailto:test@test.com",
  supported_countries: ["us"],
  supported_languages: ["en"],
  associated_domains: ["https://world.org"],
  app_rating: 3.33,
  unique_users: 0,
  impressions: 0,
  team_name: "test",
  is_allowed_unlimited_notifications: false,
  avg_notification_open_rate: null,
  can_use_implicit_credentials: false,
};

const getUrl = (app_id: string) =>
  new URL(`/api/v2/minikit/app-metadata/${app_id}`, "http://localhost:3000");

// #region Success cases tests
describe("/api/v2/minikit/app-metadata/[app_id] [success cases]", () => {
  it("can fetch a transaction", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
    GetAppMetadata.mockResolvedValue({
      app_metadata: validAppMetadataResponse,
    });

    const res = await GET(mockReq, { params: { app_id: validAppId } });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toEqual(app_metadata);
  });

  it("returns valid payload if description is null", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);
    GetAppMetadata.mockResolvedValue({
      app_metadata: [
        {
          name: "test",
          app_id: "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
          logo_img_url: "",
          meta_tag_image_url: "",
          showcase_img_urls: null,
          hero_image_url: "",
          world_app_description: "Random Values",
          world_app_button_text: "Use Integration",
          whitelisted_addresses: null,
          app_mode: "external",
          description: "",
          category: "Social",
          integration_url: "https://github.com",
          app_website_url: "",
          source_code_url: "",
          support_link: "mailto:test@test.com",
          associated_domains: ["https://world.org"],
          supported_countries: ["us"],
          supported_languages: ["en"],
          app: { team: { name: "test" }, rating_sum: 10, rating_count: 3 },
          is_allowed_unlimited_notifications: false,
        },
      ],
    });

    const res = await GET(mockReq, { params: { app_id: validAppId } });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toEqual({
      name: "test",
      app_id: "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a",
      logo_img_url: null,
      meta_tag_image_url: null,
      showcase_img_urls: null,
      hero_image_url: null,
      content_card_image_url: "",
      world_app_description: "Random Values",
      world_app_button_text: "Use Integration",
      whitelisted_addresses: null,
      app_mode: "external",
      short_name: "test",
      description: {
        overview: "",
        how_it_works: "",
        how_to_connect: "",
      },
      category: {
        id: "social",
        name: "Social",
      },
      associated_domains: ["https://world.org"],
      ratings_external_nullifier:
        "0x00d71e72b03eabb446f12650edb5cda22a932cada51bb0a16e0d5ce0ebc09965",
      integration_url: "https://github.com",
      app_website_url: "",
      source_code_url: "",
      support_link: "mailto:test@test.com",
      supported_countries: ["us"],
      supported_languages: ["en"],
      app_rating: 3.33,
      unique_users: 0,
      impressions: 0,
      team_name: "test",
      is_allowed_unlimited_notifications: false,
      avg_notification_open_rate: null,
      can_use_implicit_credentials: false,
    });
  });
});
// #endregion

// #region Error cases tests
describe("/api/v2/minikit/transaction/transaction_id [error cases]", () => {
  it("returns 401 if no api key is provided", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: "",
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await GET(mockReq, { params: { app_id: validAppId } });
    expect(res.status).toBe(401);
  });

  it("returns 404 if api key not exists", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: (Math.random() * 10 ** 10).toFixed(),
    });

    FetchAPIKey.mockResolvedValue({});

    const res = await GET(mockReq, { params: { app_id: validAppId } });
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
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await GET(mockReq, { params: { app_id: validAppId } });
    expect(res.status).toBe(403);
  });

  it("returns 403 if api key is not valid for the app", async () => {
    const mockReq = createMockRequest({
      url: getUrl("app_1234"),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue(validApiKeyResponse);

    const res = await GET(mockReq, { params: { app_id: "app_1234" } });
    expect(res.status).toBe(403);
  });

  it("returns 400 if api key is inactive", async () => {
    const mockReq = createMockRequest({
      url: getUrl(validAppId),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue({
      ...validApiKeyResponse,
      api_key_by_pk: { ...validApiKeyResponse.api_key_by_pk, is_active: false },
    });

    const res = await GET(mockReq, { params: { app_id: validAppId } });
    expect(res.status).toBe(400);
  });

  it("returns 400 if appId is empty", async () => {
    const mockReq = createMockRequest({
      url: getUrl(""),
      api_key: validApiKey,
    });

    FetchAPIKey.mockResolvedValue({});

    const res = await GET(mockReq, { params: { app_id: "" } });
    expect(res.status).toBe(400);
  });
});
// #endregion
