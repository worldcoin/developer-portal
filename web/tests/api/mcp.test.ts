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

const authResponse = {
  api_key_by_pk: {
    id: apiKeyId,
    api_key: hashedSecret.hashed_secret,
    is_active: true,
    team_id: teamId,
  },
};

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
        },
      ],
      rp_registration: [
        {
          rp_id: rpId,
          mode: "managed",
          status: "registered",
          signer_address: "0x0000000000000000000000000000000000000001",
          actions_v4: [],
        },
      ],
    },
  ],
};
let currentAppContextResponse = appContextResponse;

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
  requestMock.mockImplementation(async (query: string, variables: any) => {
    if (query.includes("AuthenticateApiKey")) return authResponse;
    if (query.includes("McpTeamContext")) {
      return { team_by_pk: { id: teamId, name: "Team", apps: [] } };
    }
    if (query.includes("McpCreateApp")) {
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
    if (query.includes("McpAppContext")) return currentAppContextResponse;
    if (query.includes("McpUpsertActionV4")) {
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
    if (query.includes("McpUpsertRpRegistration")) {
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
    if (query.includes("McpUpdateAppMetadata")) {
      return {
        update_app_metadata_by_pk: {
          id: variables.app_metadata_id,
          app_id: appId,
          ...variables.set,
          verification_status: "unverified",
        },
      };
    }
    if (query.includes("McpSubmitAppForReview")) {
      return {
        update_app_metadata_by_pk: {
          id: variables.app_metadata_id,
          app_id: appId,
          verification_status: "awaiting_review",
          is_developer_allow_listing: variables.is_developer_allow_listing,
        },
      };
    }
    throw new Error(`Unexpected query: ${query}`);
  });
});

describe("/api/mcp", () => {
  it("returns MCP initialize metadata without auth", async () => {
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
        mode: "managed",
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
});
