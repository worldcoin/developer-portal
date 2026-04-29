import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { logPortalEvent } from "@/api/helpers/portal-events";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { CategoryNameIterable } from "@/lib/categories";
import { generateRpIdString } from "@/api/helpers/rp-utils";
import { logger } from "@/lib/logger";
import { Wallet } from "ethers";
import { GraphQLClient, gql } from "graphql-request";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: any;
};

type McpAuthContext = {
  apiKeyId: string;
  teamId: string;
};

type ToolContext = McpAuthContext & {
  client: GraphQLClient;
};

class McpError extends Error {
  constructor(
    message: string,
    public code = -32000,
    public data?: unknown,
  ) {
    super(message);
  }
}

const AUTHENTICATE_API_KEY = gql`
  query AuthenticateApiKey($id: String!) {
    api_key_by_pk(id: $id) {
      id
      api_key
      is_active
      team_id
    }
  }
`;

const GET_TEAM_CONTEXT = gql`
  query McpTeamContext($team_id: String!) {
    team_by_pk(id: $team_id) {
      id
      name
      apps(
        where: { deleted_at: { _is_null: true } }
        order_by: { created_at: desc }
      ) {
        id
        name
        engine
        is_staging
        status
        created_at
        app_metadata(
          where: { verification_status: { _neq: "verified" } }
          order_by: { created_at: desc }
          limit: 1
        ) {
          id
          name
          app_mode
          category
          integration_url
          verification_status
        }
        rp_registration {
          rp_id
          mode
          status
          signer_address
          staging_status
        }
      }
    }
  }
`;

const GET_APP_CONTEXT = gql`
  query McpAppContext($team_id: String!, $app_id: String!) {
    app(
      where: {
        id: { _eq: $app_id }
        team_id: { _eq: $team_id }
        deleted_at: { _is_null: true }
      }
      limit: 1
    ) {
      id
      name
      engine
      is_staging
      status
      app_metadata(
        where: { verification_status: { _neq: "verified" } }
        order_by: { created_at: desc }
        limit: 1
      ) {
        id
        name
        short_name
        app_mode
        category
        content_card_image_url
        description
        hero_image_url
        integration_url
        is_android_only
        app_website_url
        is_for_humans_only
        logo_img_url
        meta_tag_image_url
        support_link
        showcase_img_urls
        world_app_description
        world_app_button_text
        verification_status
        is_developer_allow_listing
        supported_countries
        supported_languages
      }
      rp_registration {
        rp_id
        mode
        status
        signer_address
        staging_status
        actions_v4(order_by: { created_at: desc }) {
          id
          action
          description
          environment
        }
      }
    }
  }
`;

const CREATE_APP = gql`
  mutation McpCreateApp(
    $team_id: String!
    $name: String!
    $engine: String!
    $is_staging: Boolean!
    $category: String!
    $integration_url: String!
    $app_mode: String!
  ) {
    insert_app_one(
      object: {
        engine: $engine
        name: $name
        is_staging: $is_staging
        team_id: $team_id
        app_metadata: {
          data: {
            name: $name
            integration_url: $integration_url
            app_mode: $app_mode
            category: $category
          }
        }
      }
    ) {
      id
      name
      is_staging
      engine
      app_metadata(order_by: { created_at: desc }, limit: 1) {
        id
        app_mode
        category
        integration_url
      }
    }
  }
`;

const UPSERT_RP_REGISTRATION = gql`
  mutation McpUpsertRpRegistration(
    $rp_id: String!
    $app_id: String!
    $mode: rp_registration_mode!
    $signer_address: String
  ) {
    insert_rp_registration_one(
      object: {
        rp_id: $rp_id
        app_id: $app_id
        mode: $mode
        signer_address: $signer_address
        status: pending
      }
      on_conflict: {
        constraint: rp_registration_app_id_key
        update_columns: [mode, signer_address, status]
      }
    ) {
      rp_id
      app_id
      mode
      signer_address
      status
    }
  }
`;

const UPSERT_ACTION_V4 = gql`
  mutation McpUpsertActionV4(
    $rp_id: String!
    $action: String!
    $description: String!
    $environment: action_environment!
  ) {
    insert_action_v4_one(
      object: {
        rp_id: $rp_id
        action: $action
        description: $description
        environment: $environment
      }
      on_conflict: {
        constraint: action_v4_rp_id_action_environment_key
        update_columns: [description]
      }
    ) {
      id
      rp_id
      action
      description
      environment
    }
  }
`;

const UPDATE_APP_METADATA = gql`
  mutation McpUpdateAppMetadata(
    $app_metadata_id: String!
    $set: app_metadata_set_input!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: $set
    ) {
      id
      app_id
      name
      short_name
      app_mode
      category
      integration_url
      app_website_url
      support_link
      content_card_image_url
      description
      hero_image_url
      is_android_only
      is_for_humans_only
      logo_img_url
      meta_tag_image_url
      showcase_img_urls
      world_app_description
      world_app_button_text
      verification_status
      supported_countries
      supported_languages
      is_developer_allow_listing
    }
  }
`;

const SUBMIT_APP_FOR_REVIEW = gql`
  mutation McpSubmitAppForReview(
    $app_metadata_id: String!
    $is_developer_allow_listing: Boolean!
    $changelog: String!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: {
        verification_status: "awaiting_review"
        is_developer_allow_listing: $is_developer_allow_listing
        changelog: $changelog
      }
    ) {
      id
      app_id
      verification_status
      is_developer_allow_listing
    }
  }
`;

const toolDefinitions = [
  {
    name: "get_team_context",
    description: "Fetch the Dev Portal team and app context for this API key.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_app_config",
    description: "Fetch app, World ID, Mini App, and app store configuration.",
    inputSchema: {
      type: "object",
      properties: { app_id: { type: "string" } },
      required: ["app_id"],
      additionalProperties: false,
    },
  },
  {
    name: "create_app",
    description: "Create an external World ID app or Mini App.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        app_mode: { type: "string", enum: ["external", "mini-app"] },
        integration_url: { type: "string" },
        category: { type: "string" },
        build: { type: "string", enum: ["production", "staging"] },
        verification: { type: "string", enum: ["cloud", "on-chain"] },
      },
      required: ["name"],
      additionalProperties: false,
    },
  },
  {
    name: "configure_world_id",
    description:
      "Create or update World ID 4.0 RP config and optionally generate a signing key.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: { type: "string" },
        mode: { type: "string", enum: ["managed", "self_managed"] },
        signer_private_key: { type: "string" },
        generate_signing_key: { type: "boolean" },
      },
      required: ["app_id"],
      additionalProperties: false,
    },
  },
  {
    name: "get_world_id_signing_key",
    description:
      "Fetch signer address. Private keys are only returned on MCP generation/rotation.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: { type: "string" },
        rotate_if_unavailable: { type: "boolean" },
      },
      required: ["app_id"],
      additionalProperties: false,
    },
  },
  {
    name: "rotate_world_id_signing_key",
    description: "Generate or set a new World ID signing key for an app.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: { type: "string" },
        signer_private_key: { type: "string" },
      },
      required: ["app_id"],
      additionalProperties: false,
    },
  },
  {
    name: "create_world_id_action",
    description: "Create or update a World ID 4.0 action for an app.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: { type: "string" },
        action: { type: "string" },
        description: { type: "string" },
        environment: { type: "string", enum: ["production", "staging"] },
      },
      required: ["app_id", "action"],
      additionalProperties: false,
    },
  },
  {
    name: "configure_mini_app",
    description: "Update Mini App portal settings and app store metadata.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: { type: "string" },
        name: { type: "string" },
        short_name: { type: "string" },
        integration_url: { type: "string" },
        category: { type: "string" },
        app_website_url: { type: "string" },
        support_link: { type: "string" },
        description: { type: "string" },
        logo_img_url: { type: "string" },
        hero_image_url: { type: "string" },
        meta_tag_image_url: { type: "string" },
        showcase_img_urls: { type: "array", items: { type: "string" } },
        content_card_image_url: { type: "string" },
        world_app_description: { type: "string" },
        world_app_button_text: { type: "string" },
        supported_countries: { type: "array", items: { type: "string" } },
        supported_languages: { type: "array", items: { type: "string" } },
        is_android_only: { type: "boolean" },
        is_developer_allow_listing: { type: "boolean" },
        is_for_humans_only: { type: "boolean" },
      },
      required: ["app_id"],
      additionalProperties: false,
    },
  },
  {
    name: "submit_app_for_review",
    description:
      "Submit an app for review after explicit confirmation from the user.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: { type: "string" },
        confirm_submission: { type: "boolean" },
        changelog: { type: "string" },
        is_developer_allow_listing: { type: "boolean" },
      },
      required: ["app_id", "confirm_submission"],
      additionalProperties: false,
    },
  },
];

const appIdSchema = yup.object({ app_id: yup.string().required() }).noUnknown();

const createAppSchema = yup
  .object({
    name: yup.string().trim().required(),
    app_mode: yup.string().oneOf(["external", "mini-app"]).default("external"),
    integration_url: yup
      .string()
      .url()
      .matches(/^https:\/\//)
      .default("https://docs.world.org/"),
    category: yup.string().optional(),
    build: yup.string().oneOf(["production", "staging"]).default("production"),
    verification: yup.string().oneOf(["cloud", "on-chain"]).default("cloud"),
  })
  .noUnknown();

const configureWorldIdSchema = yup
  .object({
    app_id: yup.string().required(),
    mode: yup.string().oneOf(["managed", "self_managed"]).default("managed"),
    signer_private_key: yup.string().optional(),
    generate_signing_key: yup.boolean().default(true),
  })
  .noUnknown();

const createActionSchema = yup
  .object({
    app_id: yup.string().required(),
    action: yup.string().trim().required(),
    description: yup.string().default(""),
    environment: yup
      .string()
      .oneOf(["production", "staging"])
      .default("production"),
  })
  .noUnknown();

const configureMiniAppSchema = yup
  .object({
    app_id: yup.string().required(),
    name: yup.string().optional(),
    short_name: yup.string().optional(),
    integration_url: yup
      .string()
      .url()
      .matches(/^https:\/\//)
      .optional(),
    category: yup.string().oneOf(CategoryNameIterable).optional(),
    app_website_url: yup.string().url().optional(),
    support_link: yup.string().optional(),
    description: yup.string().optional(),
    logo_img_url: yup.string().optional(),
    hero_image_url: yup.string().optional(),
    meta_tag_image_url: yup.string().optional(),
    showcase_img_urls: yup.array().of(yup.string()).optional(),
    content_card_image_url: yup.string().optional(),
    world_app_description: yup.string().optional(),
    world_app_button_text: yup.string().optional(),
    supported_countries: yup.array().of(yup.string().length(2)).optional(),
    supported_languages: yup.array().of(yup.string()).optional(),
    is_android_only: yup.boolean().optional(),
    is_developer_allow_listing: yup.boolean().optional(),
    is_for_humans_only: yup.boolean().optional(),
  })
  .noUnknown();

const submitAppSchema = yup
  .object({
    app_id: yup.string().required(),
    confirm_submission: yup.boolean().oneOf([true]).required(),
    changelog: yup.string().default("Submitted via MCP"),
    is_developer_allow_listing: yup.boolean().default(false),
  })
  .noUnknown();

const parseApiKey = (req: NextRequest) => {
  const raw = req.headers.get("authorization")?.split(/\s+/).at(-1);
  if (!raw) {
    throw new McpError("API key is required.", -32001);
  }

  const decoded = Buffer.from(raw.replace(/^api_/, ""), "base64").toString(
    "utf8",
  );
  const [id, secret] = decoded.split(":");

  if (!id || !secret) {
    throw new McpError("Invalid API key format.", -32001);
  }

  return { id, secret };
};

const authenticate = async (req: NextRequest): Promise<McpAuthContext> => {
  const { id, secret } = parseApiKey(req);
  const client = await getAPIServiceGraphqlClient();
  const result = await client.request<{
    api_key_by_pk?: {
      id: string;
      api_key: string;
      is_active: boolean;
      team_id: string;
    } | null;
  }>(AUTHENTICATE_API_KEY, { id });

  const apiKey = result.api_key_by_pk;
  if (!apiKey) {
    throw new McpError("API key not found.", -32001);
  }
  if (!apiKey.is_active) {
    throw new McpError("API key is inactive.", -32001);
  }
  if (!verifyHashedSecret(apiKey.id, secret, apiKey.api_key)) {
    throw new McpError("API key is not valid.", -32001);
  }

  return { apiKeyId: apiKey.id, teamId: apiKey.team_id };
};

const parseInput = async <T>(schema: yup.Schema<T>, value: unknown) => {
  try {
    return await schema.validate(value ?? {}, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new McpError("Invalid tool input.", -32602, error.errors);
    }
    throw error;
  }
};

const content = (value: unknown) => ({
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
});

const requireApp = async (
  client: GraphQLClient,
  teamId: string,
  appId: string,
) => {
  const data = await client.request<{ app: any[] }>(GET_APP_CONTEXT, {
    team_id: teamId,
    app_id: appId,
  });
  const app = data.app[0];
  if (!app) {
    throw new McpError("App not found for this API key.", -32004);
  }
  return app;
};

const makeWallet = (privateKey?: string) => {
  const wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
  return {
    private_key: wallet.privateKey,
    signer_address: wallet.address,
  };
};

const rotateWorldIdSigningKey = async (input: unknown, ctx: ToolContext) => {
  const args = await parseInput(
    appIdSchema.shape({ signer_private_key: yup.string().optional() }),
    input,
  );
  const app = await requireApp(ctx.client, ctx.teamId, args.app_id);
  const registration = app.rp_registration[0];
  if (!registration) {
    throw new McpError("World ID is not configured for this app.", -32004);
  }

  const signingKey = makeWallet(args.signer_private_key);
  const data = await ctx.client.request<{ insert_rp_registration_one: any }>(
    UPSERT_RP_REGISTRATION,
    {
      rp_id: registration.rp_id,
      app_id: args.app_id,
      mode: registration.mode,
      signer_address: signingKey.signer_address,
    },
  );

  return content({
    rp_registration: data.insert_rp_registration_one,
    signing_key: signingKey,
    warning:
      "Store private_key securely. It is not recoverable after this response.",
  });
};

const tools = {
  get_team_context: async (_input, ctx) => {
    const data = await ctx.client.request(GET_TEAM_CONTEXT, {
      team_id: ctx.teamId,
    });
    return content(data);
  },

  get_app_config: async (input, ctx) => {
    const { app_id } = await parseInput(appIdSchema, input);
    const app = await requireApp(ctx.client, ctx.teamId, app_id);
    return content({
      app,
      verify_endpoint: app.rp_registration[0]
        ? `/api/v4/verify/${app.rp_registration[0].rp_id}`
        : null,
      proof_context_endpoint: app.rp_registration[0]
        ? `/api/v4/proof-context/${app.rp_registration[0].rp_id}`
        : null,
    });
  },

  create_app: async (input, ctx) => {
    const args = await parseInput(createAppSchema, input);
    const category =
      args.category ?? (args.app_mode === "mini-app" ? "Other" : "External");

    if (!CategoryNameIterable.includes(category as any)) {
      throw new McpError("Invalid app category.", -32602);
    }

    const data = await ctx.client.request<{ insert_app_one: any }>(CREATE_APP, {
      team_id: ctx.teamId,
      name: args.name,
      is_staging: args.build === "staging",
      engine: args.verification,
      category,
      integration_url: args.integration_url,
      app_mode: args.app_mode,
    });

    const app = data.insert_app_one;
    logPortalEvent({
      event: "app_creation",
      actor: "mcp",
      team_id: ctx.teamId,
      app_id: app?.id,
      metadata: {
        environment: args.build,
        engine: args.verification,
        app_mode: args.app_mode,
      },
    });

    return content({ app });
  },

  configure_world_id: async (input, ctx) => {
    const args = await parseInput(configureWorldIdSchema, input);
    const app = await requireApp(ctx.client, ctx.teamId, args.app_id);
    const existingRegistration = app.rp_registration[0];
    if (existingRegistration) {
      return content({
        rp_registration: existingRegistration,
        signing_key: null,
        verify_endpoint: `/api/v4/verify/${existingRegistration.rp_id}`,
        proof_context_endpoint: `/api/v4/proof-context/${existingRegistration.rp_id}`,
        message:
          "World ID is already configured. Use rotate_world_id_signing_key to generate a new private signing key.",
      });
    }

    const signingKey =
      args.mode === "managed" && args.generate_signing_key
        ? makeWallet(args.signer_private_key)
        : args.signer_private_key
          ? makeWallet(args.signer_private_key)
          : null;

    const data = await ctx.client.request<{ insert_rp_registration_one: any }>(
      UPSERT_RP_REGISTRATION,
      {
        rp_id: generateRpIdString(args.app_id),
        app_id: args.app_id,
        mode: args.mode,
        signer_address: signingKey?.signer_address ?? null,
      },
    );

    return content({
      rp_registration: data.insert_rp_registration_one,
      signing_key: signingKey,
      verify_endpoint: `/api/v4/verify/${data.insert_rp_registration_one.rp_id}`,
      proof_context_endpoint: `/api/v4/proof-context/${data.insert_rp_registration_one.rp_id}`,
      warning:
        "Private keys are returned only at generation/rotation time. Store the private_key securely in the app environment.",
    });
  },

  get_world_id_signing_key: async (input, ctx) => {
    const args = await parseInput(
      appIdSchema.shape({
        rotate_if_unavailable: yup.boolean().default(false),
      }),
      input,
    );
    const app = await requireApp(ctx.client, ctx.teamId, args.app_id);
    const registration = app.rp_registration[0];
    if (!registration) {
      throw new McpError("World ID is not configured for this app.", -32004);
    }

    if (args.rotate_if_unavailable) {
      return rotateWorldIdSigningKey({ app_id: args.app_id }, ctx);
    }

    return content({
      rp_id: registration.rp_id,
      signer_address: registration.signer_address,
      private_key: null,
      message:
        "Existing private signing keys are not recoverable. Use rotate_world_id_signing_key to generate a new key.",
    });
  },

  rotate_world_id_signing_key: rotateWorldIdSigningKey,

  create_world_id_action: async (input, ctx) => {
    const args = await parseInput(createActionSchema, input);
    const app = await requireApp(ctx.client, ctx.teamId, args.app_id);
    const registration = app.rp_registration[0];
    if (!registration?.rp_id) {
      throw new McpError("World ID is not configured for this app.", -32004);
    }

    const data = await ctx.client.request<{ insert_action_v4_one: any }>(
      UPSERT_ACTION_V4,
      {
        rp_id: registration.rp_id,
        action: args.action,
        description: args.description,
        environment: args.environment,
      },
    );

    logPortalEvent({
      event: "action_creation",
      actor: "mcp",
      team_id: ctx.teamId,
      app_id: args.app_id,
      action: args.action,
      metadata: { environment: args.environment, action_version: "v4" },
    });

    return content({
      action: data.insert_action_v4_one,
      registration_status: registration.status,
    });
  },

  configure_mini_app: async (input, ctx) => {
    const args = await parseInput(configureMiniAppSchema, input);
    const app = await requireApp(ctx.client, ctx.teamId, args.app_id);
    const metadata = app.app_metadata[0];
    if (!metadata) {
      throw new McpError("Editable app metadata not found.", -32004);
    }
    if (metadata.verification_status !== "unverified") {
      throw new McpError("Only unverified app metadata can be edited.", -32004);
    }

    const { app_id: _appId, ...rest } = args;
    const set = Object.fromEntries(
      Object.entries({
        ...rest,
        app_mode: "mini-app",
      }).filter(([, value]) => value !== undefined),
    );

    const data = await ctx.client.request<{ update_app_metadata_by_pk: any }>(
      UPDATE_APP_METADATA,
      {
        app_metadata_id: metadata.id,
        set,
      },
    );

    return content({ app_metadata: data.update_app_metadata_by_pk });
  },

  submit_app_for_review: async (input, ctx) => {
    const args = await parseInput(submitAppSchema, input);
    const app = await requireApp(ctx.client, ctx.teamId, args.app_id);
    if (app.is_staging) {
      throw new McpError(
        "Staging apps cannot be submitted for review.",
        -32004,
      );
    }

    const metadata = app.app_metadata[0];
    if (!metadata) {
      throw new McpError("Editable app metadata not found.", -32004);
    }
    if (metadata.verification_status !== "unverified") {
      throw new McpError("Only unverified apps can be submitted.", -32004);
    }

    const data = await ctx.client.request<{
      update_app_metadata_by_pk: any;
    }>(SUBMIT_APP_FOR_REVIEW, {
      app_metadata_id: metadata.id,
      is_developer_allow_listing: args.is_developer_allow_listing,
      changelog: args.changelog,
    });

    logPortalEvent({
      event: "app_submission",
      actor: "mcp",
      team_id: ctx.teamId,
      app_id: args.app_id,
      metadata: {
        is_developer_allow_listing: args.is_developer_allow_listing,
      },
    });

    return content({ app_metadata: data.update_app_metadata_by_pk });
  },
} satisfies Record<string, (input: unknown, ctx: ToolContext) => Promise<any>>;

type McpMethod = "initialize" | "ping" | "tools/list" | "tools/call";
type ToolName = keyof typeof tools;

const parseMcpMethod = (value: unknown): McpMethod => {
  switch (value) {
    case "initialize":
    case "ping":
    case "tools/list":
    case "tools/call":
      return value;
    default:
      throw new McpError(`Unsupported MCP method: ${String(value)}`, -32601);
  }
};

const parseToolName = (value: unknown): ToolName => {
  switch (value) {
    case "get_team_context":
    case "get_app_config":
    case "create_app":
    case "configure_world_id":
    case "get_world_id_signing_key":
    case "rotate_world_id_signing_key":
    case "create_world_id_action":
    case "configure_mini_app":
    case "submit_app_for_review":
      return value;
    default:
      throw new McpError(`Unknown tool: ${String(value)}`, -32601);
  }
};

const executeTool = async (
  name: ToolName,
  input: unknown,
  ctx: ToolContext,
) => {
  switch (name) {
    case "get_team_context":
      return tools.get_team_context(input, ctx);
    case "get_app_config":
      return tools.get_app_config(input, ctx);
    case "create_app":
      return tools.create_app(input, ctx);
    case "configure_world_id":
      return tools.configure_world_id(input, ctx);
    case "get_world_id_signing_key":
      return tools.get_world_id_signing_key(input, ctx);
    case "rotate_world_id_signing_key":
      return tools.rotate_world_id_signing_key(input, ctx);
    case "create_world_id_action":
      return tools.create_world_id_action(input, ctx);
    case "configure_mini_app":
      return tools.configure_mini_app(input, ctx);
    case "submit_app_for_review":
      return tools.submit_app_for_review(input, ctx);
  }
};

const handleJsonRpc = async (req: NextRequest, message: JsonRpcRequest) => {
  const method = parseMcpMethod(message.method);
  const auth = await authenticate(req);

  switch (method) {
    case "initialize":
      return {
        protocolVersion: "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "world-developer-portal", version: "0.1.0" },
      };
    case "ping":
      return {};
    case "tools/list": {
      return { tools: toolDefinitions };
    }
    case "tools/call": {
      const client = await getAPIServiceGraphqlClient();
      const name = parseToolName(message.params?.name);
      return executeTool(name, message.params?.arguments, { ...auth, client });
    }
  }
};

const jsonRpcResponse = (
  id: JsonRpcRequest["id"],
  result: unknown,
  init?: ResponseInit,
) =>
  NextResponse.json(
    {
      jsonrpc: "2.0",
      id,
      result,
    },
    init,
  );

const jsonRpcError = (
  id: JsonRpcRequest["id"],
  error: McpError,
  status = 200,
) =>
  NextResponse.json(
    {
      jsonrpc: "2.0",
      id,
      error: {
        code: error.code,
        message: error.message,
        data: error.data,
      },
    },
    { status },
  );

export const POST = async (req: NextRequest) => {
  let message: JsonRpcRequest;
  try {
    message = await req.json();
  } catch {
    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: "Invalid JSON-RPC request body.",
      attribute: null,
      req,
    });
  }

  if (message.id === undefined || message.id === null) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const result = await handleJsonRpc(req, message);
    return jsonRpcResponse(message.id, await result);
  } catch (error) {
    if (error instanceof McpError) {
      return jsonRpcError(message.id, error);
    }

    logger.error("Unhandled MCP error", {
      error: error as Error,
      method: message.method,
    });
    return jsonRpcError(
      message.id,
      new McpError("Internal MCP server error.", -32603),
    );
  }
};

export const GET = async () =>
  NextResponse.json({
    name: "world-developer-portal",
    transport: "streamable-http",
    endpoint: "/api/mcp",
  });

export const OPTIONS = async () =>
  new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
    },
  });
