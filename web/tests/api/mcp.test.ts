import { generateHashedSecret } from "@/api/helpers/utils";
import { POST } from "@/api/mcp";
import { logger } from "@/lib/logger";
import { generateRpIdString } from "@/lib/rp";
import { NextRequest } from "next/server";
import { getRpFromContract } from "../../api/helpers/temporal-rpc";

const requestMock = jest.fn();
const s3SendMock = jest.fn();

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

jest.mock("../../api/helpers/temporal-rpc", () => ({
  getRpFromContract: jest.fn(),
}));

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: s3SendMock })),
  PutObjectCommand: jest.fn().mockImplementation((args) => ({ ...args })),
  DeleteObjectCommand: jest
    .fn()
    .mockImplementation((args) => ({ delete: args })),
}));

const dnsLookupMock = jest.fn();
jest.mock("node:dns/promises", () => ({
  lookup: (...args: unknown[]) => dnsLookupMock(...args),
}));

const submitManagedRpRegistrationMock = jest.fn();
const submitManagedSignerRotationMock = jest.fn();
jest.mock("../../api/helpers/rp-registration-flows", () => ({
  submitManagedRpRegistration: (...args: unknown[]) =>
    submitManagedRpRegistrationMock(...args),
  submitManagedSignerRotation: (...args: unknown[]) =>
    submitManagedSignerRotationMock(...args),
}));

const httpsRequestMock = jest.fn();
jest.mock("node:https", () => ({
  request: (...args: unknown[]) => httpsRequestMock(...args),
}));

// Build a fake IncomingMessage + ClientRequest pair that drives the
// streaming reader in fetchImageFromUrl. Used by tests that simulate a
// source_url response.
type HttpsResponseShape = {
  statusCode: number;
  statusMessage?: string;
  headers?: Record<string, string>;
  body?: Buffer;
};
const mockHttpsResponse = (response: HttpsResponseShape) => {
  httpsRequestMock.mockImplementationOnce(
    (
      _options: unknown,
      callback: (
        res: NodeJS.EventEmitter & {
          statusCode: number;
          statusMessage?: string;
          headers: Record<string, string>;
          resume: () => void;
          destroy: () => void;
        },
      ) => void,
    ) => {
      const listeners: Record<string, ((arg?: unknown) => void)[]> = {};
      const res = {
        statusCode: response.statusCode,
        statusMessage: response.statusMessage ?? "",
        headers: response.headers ?? {},
        on: (event: string, handler: (arg?: unknown) => void) => {
          (listeners[event] ??= []).push(handler);
          return res;
        },
        resume: () => {},
        destroy: () => {},
      };
      // Simulate streaming on next tick so the caller's listeners attach
      // first.
      process.nextTick(() => {
        callback(res as never);
        process.nextTick(() => {
          if (response.body && response.body.length > 0) {
            for (const fn of listeners.data ?? []) fn(response.body);
          }
          for (const fn of listeners.end ?? []) fn();
        });
      });
      return {
        on: () => {},
        end: () => {},
        destroy: () => {},
      };
    },
  );
};

const mockLoggerInfo = logger.info as jest.Mock;
const mockGetRpFromContract = getRpFromContract as jest.Mock;

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
          showcase_img_urls: [] as string[],
          description: "" as string | null,
        },
      ],
      rp_registration: [
        {
          rp_id: rpId,
          mode: "self_managed",
          status: "registered",
          signer_address: "0x0000000000000000000000000000000000000001",
          staging_status: null,
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

beforeEach(async () => {
  jest.clearAllMocks();
  // Reset the in-memory rate-limit counters between tests so one suite's
  // upload bursts don't bleed into the next one.
  await (global.RedisClient as { flushall: () => Promise<unknown> }).flushall();
  process.env.RP_REGISTRY_CONTRACT_ADDRESS =
    "0x0000000000000000000000000000000000000048";
  delete process.env.RP_REGISTRY_STAGING_CONTRACT_ADDRESS;
  process.env.ASSETS_S3_REGION = "us-east-1";
  process.env.ASSETS_S3_BUCKET_NAME = "test-bucket";
  s3SendMock.mockResolvedValue({});
  httpsRequestMock.mockReset();
  dnsLookupMock.mockReset();
  // Default: source_url hostnames resolve to a single public address. The
  // helper calls `lookup(host, { all: true })`, which returns an array; we
  // adapt here so existing call sites stay simple.
  dnsLookupMock.mockResolvedValue([{ address: "203.0.113.10", family: 4 }]);
  submitManagedRpRegistrationMock.mockReset();
  submitManagedSignerRotationMock.mockReset();
  // Default: managed flows succeed. Specific tests override to assert
  // failure paths (already_registered, self_managed_mode, etc.).
  submitManagedRpRegistrationMock.mockImplementation(
    async ({ appId, signerAddress }) => ({
      ok: true,
      rpIdString: generateRpIdString(appId),
      managerAddress: "0x1111111111111111111111111111111111111111",
      signerAddress,
      operationHash: "0xop_hash_register",
      status: "pending",
      stagingOperationHash: null,
      stagingStatus: null,
    }),
  );
  submitManagedSignerRotationMock.mockImplementation(
    async ({ appId, newSignerAddress }) => ({
      ok: true,
      rpIdString: generateRpIdString(appId),
      newSignerAddress,
      oldSignerAddress: "0x0000000000000000000000000000000000000001",
      operationHash: "0xop_hash_rotate",
      status: "pending",
    }),
  );
  currentAppContextResponse = appContextResponse;
  mockGetRpFromContract.mockResolvedValue({
    initialized: true,
    active: true,
    manager: "0x0000000000000000000000000000000000000002",
    signer: "0x0000000000000000000000000000000000000001",
    oprfKeyId: 0n,
    unverifiedWellKnownDomain: "Test App",
  });
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
    if (operationName.includes("UpdateRpStatus")) {
      return {
        update_rp_registration_by_pk: {
          rp_id: variables.rp_id,
          status: variables.status,
          updated_at: "2026-04-29T00:00:00.000Z",
        },
      };
    }
    if (operationName.includes("UpdateStagingStatus")) {
      return {
        update_rp_registration_by_pk: {
          rp_id: variables.rp_id,
          staging_status: variables.staging_status,
          updated_at: "2026-04-29T00:00:00.000Z",
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
    expect(body.result.instructions).toEqual(
      expect.stringContaining("World ID"),
    );
    expect(body.result.instructions).toEqual(
      expect.stringContaining("Canonical flows"),
    );
  });

  it("keeps SKILL.md and SKILL_INSTRUCTIONS in sync", async () => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const { SKILL_INSTRUCTIONS } = await import("@/api/mcp/skill");
    const md = await fs.readFile(
      path.join(__dirname, "../../api/mcp/SKILL.md"),
      "utf-8",
    );
    // Strip YAML frontmatter (---\n...\n---\n) so we compare body to body.
    const body = md.replace(/^---\n[\s\S]*?\n---\n+/, "");
    expect(SKILL_INSTRUCTIONS.trim()).toBe(body.trim());
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
    expect(body.result.tools.map((tool: any) => tool.name)).toContain(
      "get_world_id_registration_status",
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

  it("configures World ID via the managed flow and returns a one-time signing key", async () => {
    currentAppContextResponse = {
      app: [{ ...appContextResponse.app[0], rp_registration: [] }],
    };

    const res = await POST(callTool("configure_world_id", { app_id: appId }));

    expect(res.status).toBe(200);
    const body = await res.json();
    const payload = JSON.parse(body.result.content[0].text);
    expect(payload.rp_id).toBe(rpId);
    expect(payload.manager_address).toBe(
      "0x1111111111111111111111111111111111111111",
    );
    expect(payload.operation_hash).toBe("0xop_hash_register");
    expect(payload.status).toBe("pending");
    expect(payload.signing_key.private_key).toMatch(/^0x/);
    expect(payload.signing_key.signer_address).toMatch(/^0x/);
    expect(submitManagedRpRegistrationMock).toHaveBeenCalledTimes(1);
    expect(submitManagedRpRegistrationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        appId,
        teamId,
        signerAddress: payload.signing_key.signer_address,
      }),
    );
  });

  it("surfaces feature_not_enabled from the registration helper as -32004", async () => {
    currentAppContextResponse = {
      app: [{ ...appContextResponse.app[0], rp_registration: [] }],
    };
    submitManagedRpRegistrationMock.mockResolvedValueOnce({
      ok: false,
      code: "feature_not_enabled",
      detail: "World ID 4.0 is not enabled for this team.",
    });

    const res = await POST(callTool("configure_world_id", { app_id: appId }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32004);
    expect(body.error.data.reason).toBe("feature_not_enabled");
  });

  it("rotates the signing key via the managed flow when one is missing and rotate_if_unavailable is set", async () => {
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
    expect(payload.rp_id).toBe(rpId);
    expect(payload.operation_hash).toBe("0xop_hash_rotate");
    expect(payload.signing_key.private_key).toMatch(/^0x/);
    expect(payload.signing_key.signer_address).toMatch(/^0x/);
    expect(submitManagedSignerRotationMock).toHaveBeenCalledTimes(1);
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

  it("syncs World ID registration status from the production registry", async () => {
    currentAppContextResponse = {
      app: [
        {
          ...appContextResponse.app[0],
          rp_registration: [
            {
              ...appContextResponse.app[0].rp_registration[0],
              status: "pending",
            },
          ],
        },
      ],
    };

    const res = await POST(
      callTool("get_world_id_registration_status", { app_id: appId }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    const payload = JSON.parse(body.result.content[0].text);
    expect(payload).toEqual(
      expect.objectContaining({
        rp_id: rpId,
        production_status: "registered",
        status_endpoint: `/api/v4/rp-status/${rpId}`,
      }),
    );

    const updateCall = requestMock.mock.calls.find(
      ([query]) => getOperationName(query) === "UpdateRpStatus",
    );
    expect(updateCall?.[1]).toEqual(
      expect.objectContaining({ rp_id: rpId, status: "registered" }),
    );
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

  it("surfaces a self_managed_mode rotation failure as -32004", async () => {
    submitManagedSignerRotationMock.mockResolvedValueOnce({
      ok: false,
      code: "self_managed_mode",
      detail:
        "RP is in self-managed mode. You must handle signer key rotation yourself.",
    });

    const res = await POST(
      callTool("rotate_world_id_signing_key", { app_id: appId }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32004);
    expect(body.error.data.reason).toBe("self_managed_mode");
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

  it("updates Mini App advanced fields (contracts, permit2, notification cap)", async () => {
    const res = await POST(
      callTool("configure_mini_app", {
        app_id: appId,
        contracts: ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
        permit2_tokens: ["0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"],
        whitelisted_addresses: ["0xcccccccccccccccccccccccccccccccccccccccc"],
        associated_domains: ["https://example.com"],
        can_import_all_contacts: true,
        can_use_attestation: true,
        max_notifications_per_day: 2,
      }),
    );

    expect(res.status).toBe(200);
    const updateCall = requestMock.mock.calls.find(
      ([query]) => getOperationName(query) === "McpUpdateAppMetadata",
    );
    expect(updateCall?.[1].set).toEqual(
      expect.objectContaining({
        contracts: '{"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}',
        permit2_tokens: '{"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}',
        whitelisted_addresses: '{"0xcccccccccccccccccccccccccccccccccccccccc"}',
        associated_domains: '{"https://example.com"}',
        can_import_all_contacts: true,
        can_use_attestation: true,
        max_notifications_per_day: 2,
        is_allowed_unlimited_notifications: false,
      }),
    );
  });

  it("maps max_notifications_per_day=unlimited to the unlimited flag pair", async () => {
    const res = await POST(
      callTool("configure_mini_app", {
        app_id: appId,
        max_notifications_per_day: "unlimited",
      }),
    );

    expect(res.status).toBe(200);
    const updateCall = requestMock.mock.calls.find(
      ([query]) => getOperationName(query) === "McpUpdateAppMetadata",
    );
    expect(updateCall?.[1].set).toEqual(
      expect.objectContaining({
        max_notifications_per_day: 0,
        is_allowed_unlimited_notifications: true,
      }),
    );
  });

  it("rejects malformed contract addresses with a JSON-RPC validation error", async () => {
    const res = await POST(
      callTool("configure_mini_app", {
        app_id: appId,
        contracts: ["not-an-address"],
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32602);
  });

  it.each([
    ["comma", "https://example.com,evil.com"],
    ["double quote", 'https://example.com/"x"'],
    ["backslash", "https://example.com/\\path"],
  ])(
    "rejects associated_domains entries containing a %s",
    async (_name, value) => {
      const res = await POST(
        callTool("configure_mini_app", {
          app_id: appId,
          associated_domains: [value],
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.error.code).toBe(-32602);
      expect(
        requestMock.mock.calls.some(
          ([query]) => getOperationName(query) === "McpUpdateAppMetadata",
        ),
      ).toBe(false);
    },
  );

  it("encodes description_overview / how_it_works / connect into a JSON description", async () => {
    const res = await POST(
      callTool("configure_mini_app", {
        app_id: appId,
        description_overview: "Cool app",
        description_how_it_works: "It works like this",
        description_connect: "Connect on X",
      }),
    );

    expect(res.status).toBe(200);
    const updateCall = requestMock.mock.calls.find(
      ([query]) => getOperationName(query) === "McpUpdateAppMetadata",
    );
    const set = updateCall?.[1].set ?? {};
    expect(JSON.parse(set.description)).toEqual({
      description_overview: "Cool app",
      description_how_it_works: "It works like this",
      description_connect: "Connect on X",
    });
  });

  it("prefers explicit description over the encoded sub-fields", async () => {
    const res = await POST(
      callTool("configure_mini_app", {
        app_id: appId,
        description: '{"description_overview":"raw"}',
        description_overview: "Cool app",
      }),
    );

    expect(res.status).toBe(200);
    const updateCall = requestMock.mock.calls.find(
      ([query]) => getOperationName(query) === "McpUpdateAppMetadata",
    );
    expect(updateCall?.[1].set.description).toBe(
      '{"description_overview":"raw"}',
    );
  });

  it("preserves untouched description sub-fields when patching just description_overview", async () => {
    currentAppContextResponse = {
      app: [
        {
          ...appContextResponse.app[0],
          app_metadata: [
            {
              ...appContextResponse.app[0].app_metadata[0],
              description: JSON.stringify({
                description_overview: "OLD overview",
                description_how_it_works: "PRESERVE this",
                description_connect: "PRESERVE this too",
              }),
            },
          ],
        },
      ],
    };

    const res = await POST(
      callTool("configure_mini_app", {
        app_id: appId,
        description_overview: "NEW overview",
      }),
    );

    expect(res.status).toBe(200);
    const updateCall = requestMock.mock.calls.find(
      ([query]) => getOperationName(query) === "McpUpdateAppMetadata",
    );
    expect(JSON.parse(updateCall?.[1].set.description)).toEqual({
      description_overview: "NEW overview",
      description_how_it_works: "PRESERVE this",
      description_connect: "PRESERVE this too",
    });
  });

  it("uploads a logo image from a source_url and patches logo_img_url", async () => {
    const pngBytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    mockHttpsResponse({
      statusCode: 200,
      headers: { "content-type": "image/png" },
      body: pngBytes,
    });

    const res = await POST(
      callTool("upload_app_image", {
        app_id: appId,
        image_type: "logo",
        source_url: "https://cdn.example.com/logo.png",
      }),
    );

    expect(res.status).toBe(200);
    const payload = JSON.parse((await res.json()).result.content[0].text);
    expect(payload.file_name).toBe("logo_img.png");
    expect(payload.s3_key).toBe(`unverified/${appId}/logo_img.png`);
    expect(s3SendMock).toHaveBeenCalledTimes(1);

    const updateCall = requestMock.mock.calls.find(
      ([query]) => getOperationName(query) === "McpUpdateAppMetadata",
    );
    expect(updateCall?.[1].set).toEqual({ logo_img_url: "logo_img.png" });
  });

  it("uploads a base64 image and detects format from magic bytes", async () => {
    const jpegBase64 = Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString("base64");

    const res = await POST(
      callTool("upload_app_image", {
        app_id: appId,
        image_type: "content_card",
        image_base64: jpegBase64,
      }),
    );

    expect(res.status).toBe(200);
    const payload = JSON.parse((await res.json()).result.content[0].text);
    expect(payload.file_name).toBe("content_card_image.jpg");
    expect(payload.content_type).toBe("image/jpeg");
    expect(httpsRequestMock).not.toHaveBeenCalled();

    const updateCall = requestMock.mock.calls.find(
      ([query]) => getOperationName(query) === "McpUpdateAppMetadata",
    );
    expect(updateCall?.[1].set).toEqual({
      content_card_image_url: "content_card_image.jpg",
    });
  });

  it("rejects base64 bytes that aren't a valid PNG/JPEG", async () => {
    const notAnImage = Buffer.from("hello world").toString("base64");
    const res = await POST(
      callTool("upload_app_image", {
        app_id: appId,
        image_type: "logo",
        image_base64: notAnImage,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32602);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("places showcase_2 in the second slot of showcase_img_urls", async () => {
    currentAppContextResponse = {
      app: [
        {
          ...appContextResponse.app[0],
          app_metadata: [
            {
              ...appContextResponse.app[0].app_metadata[0],
              showcase_img_urls: ["showcase_img_1.png"],
            },
          ],
        },
      ],
    };
    const pngBytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    mockHttpsResponse({
      statusCode: 200,
      headers: { "content-type": "image/png" },
      body: pngBytes,
    });

    const res = await POST(
      callTool("upload_app_image", {
        app_id: appId,
        image_type: "showcase_2",
        source_url: "https://cdn.example.com/showcase2.png",
      }),
    );

    expect(res.status).toBe(200);
    const updateCall = requestMock.mock.calls.find(
      ([query]) => getOperationName(query) === "McpUpdateAppMetadata",
    );
    expect(updateCall?.[1].set).toEqual({
      showcase_img_urls: ["showcase_img_1.png", "showcase_img_2.png"],
    });
  });

  it("rejects images that exceed the 500KB cap", async () => {
    const huge = Buffer.alloc(501 * 1024, 0).toString("base64");
    const res = await POST(
      callTool("upload_app_image", {
        app_id: appId,
        image_type: "logo",
        image_base64: huge,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32602);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("rejects source_url that resolves to a private address", async () => {
    dnsLookupMock.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);

    const res = await POST(
      callTool("upload_app_image", {
        app_id: appId,
        image_type: "logo",
        source_url: "https://internal.example.com/logo.png",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32602);
    expect(body.error.message).toMatch(/private\/internal/);
    expect(httpsRequestMock).not.toHaveBeenCalled();
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it.each([
    ["dotted IPv4-mapped IPv6 loopback", "::ffff:127.0.0.1"],
    ["hex IPv4-mapped IPv6 loopback", "::ffff:7f00:1"],
    ["hex IPv4-mapped IPv6 RFC1918", "::ffff:0a00:1"],
  ])(
    "rejects source_url whose DNS records include %s",
    async (_name, mappedAddress) => {
      dnsLookupMock.mockResolvedValue([{ address: mappedAddress, family: 6 }]);

      const res = await POST(
        callTool("upload_app_image", {
          app_id: appId,
          image_type: "logo",
          source_url: "https://example.com/logo.png",
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.error.code).toBe(-32602);
      expect(body.error.message).toMatch(/private\/internal/);
      expect(httpsRequestMock).not.toHaveBeenCalled();
    },
  );

  it("rejects source_url where any of the resolved A/AAAA records is private", async () => {
    dnsLookupMock.mockResolvedValue([
      { address: "203.0.113.10", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ]);

    const res = await POST(
      callTool("upload_app_image", {
        app_id: appId,
        image_type: "logo",
        source_url: "https://mixed.example.com/logo.png",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32602);
    expect(body.error.message).toMatch(/private\/internal/);
    expect(httpsRequestMock).not.toHaveBeenCalled();
  });

  it("rejects source_url with Content-Length above the 500KB cap before reading body", async () => {
    mockHttpsResponse({
      statusCode: 200,
      headers: {
        "content-type": "image/png",
        "content-length": String(600 * 1024),
      },
      body: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
    });

    const res = await POST(
      callTool("upload_app_image", {
        app_id: appId,
        image_type: "logo",
        source_url: "https://cdn.example.com/big.png",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32602);
    expect(body.error.message).toMatch(/Content-Length/);
    expect(s3SendMock).not.toHaveBeenCalled();
  });

  it("pins the connection to the validated IP — fetch never re-resolves the hostname", async () => {
    dnsLookupMock.mockResolvedValue([{ address: "203.0.113.55", family: 4 }]);
    mockHttpsResponse({
      statusCode: 200,
      headers: { "content-type": "image/png" },
      body: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    });

    const res = await POST(
      callTool("upload_app_image", {
        app_id: appId,
        image_type: "logo",
        source_url: "https://cdn.example.com/logo.png",
      }),
    );

    expect(res.status).toBe(200);
    expect(httpsRequestMock).toHaveBeenCalledTimes(1);
    const [requestOptions] = httpsRequestMock.mock.calls[0];
    expect(requestOptions.host).toBe("cdn.example.com");
    // The custom lookup we wired in must always return the validated IP,
    // regardless of what hostname the connect path asks for. This forces
    // any fresh resolution by the underlying HTTP stack to be ignored.
    const lookupCb = jest.fn();
    requestOptions.lookup("attacker-controlled.example", {}, lookupCb);
    expect(lookupCb).toHaveBeenCalledWith(null, "203.0.113.55", 4);
  });

  it("rate-limits upload_app_image at 60/minute per API key", async () => {
    const pngBytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    httpsRequestMock.mockImplementation((_options, callback) => {
      const listeners: Record<string, ((arg?: unknown) => void)[]> = {};
      const res = {
        statusCode: 200,
        statusMessage: "OK",
        headers: { "content-type": "image/png" },
        on: (event: string, handler: (arg?: unknown) => void) => {
          (listeners[event] ??= []).push(handler);
          return res;
        },
        resume: () => {},
        destroy: () => {},
      };
      process.nextTick(() => {
        callback(res);
        process.nextTick(() => {
          for (const fn of listeners.data ?? []) fn(pngBytes);
          for (const fn of listeners.end ?? []) fn();
        });
      });
      return { on: () => {}, end: () => {}, destroy: () => {} };
    });

    const callOnce = () =>
      POST(
        callTool("upload_app_image", {
          app_id: appId,
          image_type: "logo",
          source_url: "https://cdn.example.com/logo.png",
        }),
      );

    // 60 calls inside the same minute window pass.
    for (let i = 0; i < 60; i++) {
      const res = await callOnce();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.error).toBeUndefined();
    }

    const blocked = await callOnce();
    expect(blocked.status).toBe(200);
    const blockedBody = await blocked.json();
    expect(blockedBody.error.code).toBe(-32029);
    expect(blockedBody.error.data.retry_after_seconds).toBeGreaterThan(0);
  });

  it("rolls back the S3 object when the metadata patch fails", async () => {
    const pngBytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    mockHttpsResponse({
      statusCode: 200,
      headers: { "content-type": "image/png" },
      body: pngBytes,
    });

    const baseImpl = requestMock.getMockImplementation()!;
    requestMock.mockImplementation(async (query: unknown, variables: any) => {
      if (getOperationName(query) === "McpUpdateAppMetadata") {
        throw new Error("simulated Hasura outage");
      }
      return baseImpl(query, variables);
    });

    const res = await POST(
      callTool("upload_app_image", {
        app_id: appId,
        image_type: "logo",
        source_url: "https://cdn.example.com/logo.png",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32603);
    expect(body.error.data).toEqual(
      expect.objectContaining({
        committed: false,
        file_name: "logo_img.png",
      }),
    );
    // First call: PutObject. Second call: DeleteObject (best-effort cleanup).
    expect(s3SendMock).toHaveBeenCalledTimes(2);
  });

  it("ignores legacy locale input and uploads to the default-locale path so default-locale fields are never corrupted", async () => {
    // locale used to scope the S3 key prefix while the DB write still
    // patched the base app_metadata row, which would leave the
    // default-locale logo_img_url pointing at a path that has no asset.
    // Locale was removed from the input schema; Yup's stripUnknown
    // silently drops it, and the upload lands at the base path that the
    // (single) DB field actually references.
    const pngBytes = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    const res = await POST(
      callTool("upload_app_image", {
        app_id: appId,
        image_type: "logo",
        image_base64: pngBytes.toString("base64"),
        locale: "es",
      }),
    );

    expect(res.status).toBe(200);
    const payload = JSON.parse((await res.json()).result.content[0].text);
    expect(payload.s3_key).toBe(`unverified/${appId}/logo_img.png`);
    const updateCall = requestMock.mock.calls.find(
      ([query]) => getOperationName(query) === "McpUpdateAppMetadata",
    );
    expect(updateCall?.[1].set).toEqual({ logo_img_url: "logo_img.png" });
  });

  it("rejects when neither source_url nor image_base64 is provided", async () => {
    const res = await POST(
      callTool("upload_app_image", {
        app_id: appId,
        image_type: "logo",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.error.code).toBe(-32602);
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
