import { generateHashedSecret } from "@/api/helpers/utils";
import { POST } from "@/api/mcp";
import { logger } from "@/lib/logger";
import { generateRpIdString } from "@/lib/rp";
import { NextRequest } from "next/server";

const requestMock = jest.fn();

jest.mock("../../api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(async () => ({ request: requestMock })),
}));

jest.mock("../../lib/logger", () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockLoggerInfo = logger.info as jest.Mock;

const teamId = "team_dd2ecd36c6c45f645e8e5d9a31abdee1";
const apiKeyId = "key_667f5fbd4ad943622b4b2d3eb258f89c";
const hashedSecret = generateHashedSecret(apiKeyId);
const validApiKey = `api_${Buffer.from(`${apiKeyId}:${hashedSecret.secret}`)
  .toString("base64")
  .replace(/=/g, "")}`;

const appId = "app_staging_9cdd0a714aec9ed17dca660bc9ffe72a";
const rpId = generateRpIdString(appId);

const appContextResponse = {
  app: [
    {
      id: appId,
      name: "Test App",
      engine: "cloud",
      is_staging: false,
      status: "active",
      app_metadata: [
        {
          id: "meta_123",
          app_mode: "mini-app",
          verification_status: "unverified",
          is_developer_allow_listing: false,
        },
      ],
      rp_registration: [
        {
          rp_id: rpId,
          mode: "self_managed",
          status: "registered",
          signer_address: "0x0000000000000000000000000000000000000001",
          actions_v4: [],
        },
      ],
    },
  ],
};

const reviewMetadata = {
  id: "meta_123",
  app_id: appId,
  name: "Test App",
  short_name: "Test",
  logo_img_url: "logo.png",
  showcase_img_urls: ["showcase.png"],
  meta_tag_image_url: "meta.png",
  world_app_description: "World tagline",
  description:
    '{"description_overview":"An overview that is long enough to satisfy the schema.","description_how_it_works":"","description_connect":""}',
  category: "Other",
  app_website_url: "https://example.com",
  support_link: "mailto:support@example.com",
  supported_countries: ["us"],
  supported_languages: ["en"],
  is_android_only: false,
  is_for_humans_only: false,
  app_mode: "mini-app",
  verification_status: "unverified",
  content_card_image_url: "card.png",
  app: { is_staging: false },
};
const reviewLocalisations: Array<Record<string, unknown>> = [];
let currentAppContextResponse = appContextResponse;

const getOperationName = (query: unknown) => {
  if (typeof query === "string") {
    return query;
  }

  return (
    (query as { definitions?: { name?: { value?: string } }[] })
      .definitions?.[0]?.name?.value ?? ""
  );
};

const createRequest = (body: Record<string, unknown>, apiKey = validApiKey) =>
  new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

const callTool = (name: string, args: Record<string, unknown>) =>
  createRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name, arguments: args },
  });

beforeEach(() => {
  jest.clearAllMocks();
  currentAppContextResponse = appContextResponse;
  requestMock.mockImplementation(async (query: unknown, variables: any) => {
    const operationName = getOperationName(query);

    if (operationName.includes("McpAuthenticateTeam")) {
      if (variables.id !== apiKeyId) {
        return { api_key_by_pk: null };
      }
      return {
        api_key_by_pk: {
          id: apiKeyId,
          api_key: hashedSecret.hashed_secret,
          is_active: true,
          team_id: teamId,
        },
      };
    }
    if (operationName.includes("McpTeamContext")) {
      return { team_by_pk: { id: teamId, name: "Team", apps: [] } };
    }
    if (operationName.includes("McpCreateApp")) {
      return {
        insert_app_one: {
          id: appId,
          name: variables.name,
          is_staging: variables.is_staging,
          engine: variables.engine,
          app_metadata: [
            {
              id: "meta_123",
              app_mode: variables.app_mode,
              category: variables.category,
              integration_url: variables.integration_url,
            },
          ],
        },
      };
    }
    if (operationName.includes("McpAppContext"))
      return currentAppContextResponse;
    if (operationName.includes("McpUpsertActionV4")) {
      return {
        insert_action_v4_one: {
          id: "action_v4_123",
          rp_id: variables.rp_id,
          action: variables.action,
          description: variables.description,
          environment: variables.environment,
        },
      };
    }
    if (operationName.includes("McpUpsertRpRegistration")) {
      return {
        insert_rp_registration_one: {
          rp_id: variables.rp_id,
          app_id: variables.app_id,
          mode: variables.mode,
          signer_address: variables.signer_address,
          status: "pending",
        },
      };
    }
    if (operationName.includes("McpUpdateAppMetadata")) {
      return {
        update_app_metadata_by_pk: {
          id: variables.app_metadata_id,
          app_id: appId,
          ...variables.set,
          verification_status: "unverified",
        },
      };
    }
    if (operationName.includes("McpSubmitAppForReview")) {
      return {
        update_app_metadata_by_pk: {
          id: variables.app_metadata_id,
          app_id: appId,
          verification_status: "awaiting_review",
          is_developer_allow_listing: variables.is_developer_allow_listing,
        },
      };
    }
    if (operationName.includes("FetchAppMetadataById")) {
      return {
        app_metadata: [reviewMetadata],
        localisations: reviewLocalisations,
      };
    }
    throw new Error(`Unexpected query: ${operationName}`);
  });
});

describe("/api/mcp", () => {
  it("returns MCP initialize metadata with a valid dev portal API key", async () => {
    const res = await POST(
      createRequest({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.serverInfo.name).toBe("world-developer-portal");
  });

  it("lists tools with a valid dev portal API key", async () => {
    const res = await POST(
      createRequest({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.tools.map((tool: any) => tool.name)).toContain(
      "create_app",
    );
  });

  it("creates an app and logs MCP app creation", async () => {
    const res = await POST(
      callTool("create_app", {
        name: "MCP App",
        app_mode: "mini-app",
        integration_url: "https://example.com",
        category: "Other",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    const payload = JSON.parse(body.result.content[0].text);
    expect(payload.app.id).toBe(appId);
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "portal_app_creation",
      expect.objectContaining({ actor: "mcp", app_id: appId, team_id: teamId }),
    );
  });

  it("applies defaults when creating an app with only a name", async () => {
    const res = await POST(
      callTool("create_app", {
        name: "MCP Defaults",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    const payload = JSON.parse(body.result.content[0].text);
    expect(payload.app.engine).toBe("cloud");
    expect(payload.app.is_staging).toBe(false);
    expect(payload.app.app_metadata[0]).toEqual(
      expect.objectContaining({
        app_mode: "external",
        category: "External",
        integration_url: "https://docs.world.org/",
      }),
    );
  });

  it("creates a World ID action and logs MCP action creation", async () => {
    const res = await POST(
      callTool("create_world_id_action", {
        app_id: appId,
        action: "verify-account",
        description: "Verify account ownership",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    const payload = JSON.parse(body.result.content[0].text);
    expect(payload.action.action).toBe("verify-account");
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "portal_action_creation",
      expect.objectContaining({
        actor: "mcp",
        app_id: appId,
        action: "verify-account",
      }),
    );
  });

  it("configures World ID and returns a one-time signing key", async () => {
    currentAppContextResponse = {
      app: [{ ...appContextResponse.app[0], rp_registration: [] }],
    };

    const res = await POST(
      callTool("configure_world_id", {
        app_id: appId,
        generate_signing_key: true,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    const payload = JSON.parse(body.result.content[0].text);
    expect(payload.rp_registration.rp_id).toBe(rpId);
    expect(payload.signing_key.private_key).toMatch(/^0x/);
    expect(payload.signing_key.signer_address).toMatch(/^0x/);
  });

  it("rotates the signing key when one is missing and rotate_if_unavailable is set", async () => {
    const baseRegistration = appContextResponse.app[0].rp_registration[0];
    const { signer_address: _signerAddress, ...registrationWithoutSigner } =
      baseRegistration;
    currentAppContextResponse = {
      app: [
        {
          ...appContextResponse.app[0],
          rp_registration: [
            registrationWithoutSigner as typeof baseRegistration,
          ],
        },
      ],
    };

    const res = await POST(
      callTool("get_world_id_signing_key", {
        app_id: appId,
        rotate_if_unavailable: true,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    const payload = JSON.parse(body.result.content[0].text);
    expect(payload.rp_registration.rp_id).toBe(rpId);
    expect(payload.signing_key.private_key).toMatch(/^0x/);
    expect(payload.signing_key.signer_address).toMatch(/^0x/);
  });

  it("does not rotate when a signer is already configured", async () => {
    const res = await POST(
      callTool("get_world_id_signing_key", {
        app_id: appId,
        rotate_if_unavailable: true,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    const payload = JSON.parse(body.result.content[0].text);
    expect(payload.signer_address).toBe(
      "0x0000000000000000000000000000000000000001",
    );
    expect(payload.private_key).toBeNull();
    expect(
      requestMock.mock.calls.some(
        ([query]) => getOperationName(query) === "McpUpsertRpRegistration",
      ),
    ).toBe(false);
  });

  it("returns -32602 for malformed signer_private_key", async () => {
    const res = await POST(
      callTool("rotate_world_id_signing_key", {
        app_id: appId,
        signer_private_key: "not-a-valid-key",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32602);
    expect(body.error.message).toMatch(/signer_private_key/);
  });

  it("refuses to rotate signing keys for managed RPs", async () => {
    currentAppContextResponse = {
      app: [
        {
          ...appContextResponse.app[0],
          rp_registration: [
            {
              ...appContextResponse.app[0].rp_registration[0],
              mode: "managed",
            },
          ],
        },
      ],
    };

    const res = await POST(
      callTool("rotate_world_id_signing_key", { app_id: appId }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.message).toMatch(/developer portal UI/);
  });

  it("updates Mini App metadata through an app-owned context", async () => {
    const res = await POST(
      callTool("configure_mini_app", {
        app_id: appId,
        short_name: "MCP",
        integration_url: "https://example.com/mini",
        category: "Other",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    const payload = JSON.parse(body.result.content[0].text);
    expect(payload.app_metadata.app_mode).toBe("mini-app");
    expect(payload.app_metadata.short_name).toBe("MCP");
  });

  it("rejects Mini App metadata updates after review submission", async () => {
    currentAppContextResponse = {
      app: [
        {
          ...appContextResponse.app[0],
          app_metadata: [
            {
              ...appContextResponse.app[0].app_metadata[0],
              verification_status: "awaiting_review",
            },
          ],
        },
      ],
    };

    const res = await POST(
      callTool("configure_mini_app", {
        app_id: appId,
        short_name: "MCP",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.message).toBe(
      "Only unverified app metadata can be edited.",
    );
  });

  it("submits an app for review only with explicit confirmation", async () => {
    const res = await POST(
      callTool("submit_app_for_review", {
        app_id: appId,
        confirm_submission: true,
        is_developer_allow_listing: true,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    const payload = JSON.parse(body.result.content[0].text);
    expect(payload.app_metadata.verification_status).toBe("awaiting_review");
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      "portal_app_submission",
      expect.objectContaining({ actor: "mcp", app_id: appId, team_id: teamId }),
    );
  });

  it("rejects review submission when metadata is incomplete", async () => {
    const incompleteMetadata = { ...reviewMetadata, logo_img_url: "" };
    requestMock.mockImplementation(async (query: unknown, variables: any) => {
      const operationName = getOperationName(query);
      if (operationName.includes("McpAuthenticateTeam")) {
        return {
          api_key_by_pk: {
            id: apiKeyId,
            api_key: hashedSecret.hashed_secret,
            is_active: true,
            team_id: teamId,
          },
        };
      }
      if (operationName.includes("McpAppContext"))
        return currentAppContextResponse;
      if (operationName.includes("FetchAppMetadataById")) {
        return {
          app_metadata: [incompleteMetadata],
          localisations: reviewLocalisations,
        };
      }
      throw new Error(`Unexpected query: ${operationName}`);
    });

    const res = await POST(
      callTool("submit_app_for_review", {
        app_id: appId,
        confirm_submission: true,
        is_developer_allow_listing: true,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.message).toMatch(/incomplete/i);
  });

  it("rejects tool calls with an invalid API key", async () => {
    const invalidApiKey = `api_${Buffer.from(`${apiKeyId}:bad`).toString(
      "base64",
    )}`;
    const res = await POST(
      createRequest(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "get_team_context", arguments: {} },
        },
        invalidApiKey,
      ),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.message).toBe("API key is not valid.");
  });

  it("rejects bearer tokens that are not API keys", async () => {
    const jwtToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.fake.fake";
    const res = await POST(
      createRequest(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "get_team_context", arguments: {} },
        },
        jwtToken,
      ),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32001);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("returns 202 with no body for accepted notifications", async () => {
    const res = await POST(
      createRequest({
        jsonrpc: "2.0",
        method: "notifications/initialized",
      }),
    );

    expect(res.status).toBe(202);
    expect(await res.text()).toBe("");
  });

  it("treats requests with id: null as regular calls and responds in kind", async () => {
    const res = await POST(
      createRequest({
        jsonrpc: "2.0",
        id: null,
        method: "initialize",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.jsonrpc).toBe("2.0");
    expect(body.id).toBeNull();
    expect(body.result.serverInfo.name).toBe("world-developer-portal");
  });

  it("returns a JSON-RPC parse error for malformed request bodies", async () => {
    const req = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${validApiKey}`,
      },
      body: "{not json",
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.jsonrpc).toBe("2.0");
    expect(body.error.code).toBe(-32700);
  });

  it("preserves is_developer_allow_listing when submitter omits it", async () => {
    currentAppContextResponse = {
      app: [
        {
          ...appContextResponse.app[0],
          app_metadata: [
            {
              ...appContextResponse.app[0].app_metadata[0],
              is_developer_allow_listing: true,
            },
          ],
        },
      ],
    };

    const res = await POST(
      callTool("submit_app_for_review", {
        app_id: appId,
        confirm_submission: true,
      }),
    );

    expect(res.status).toBe(200);
    const submitCall = requestMock.mock.calls.find(
      ([query]) => getOperationName(query) === "McpSubmitAppForReview",
    );
    expect(submitCall?.[1]).toEqual(
      expect.objectContaining({ is_developer_allow_listing: true }),
    );
  });
});
