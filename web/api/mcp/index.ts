import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { logPortalEvent } from "@/api/helpers/portal-events";
import {
  mapOnChainToDbStatus,
  normalizeAddress,
  parseRpId,
} from "@/api/helpers/rp-utils";
import {
  submitManagedRpRegistration,
  submitManagedSignerRotation,
  type ManagedRegistrationResult,
  type ManagedRotationResult,
} from "@/api/helpers/rp-registration-flows";
import { getRpFromContract } from "@/api/helpers/temporal-rpc";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { getSdk as getMcpAppContextSdk } from "@/api/mcp/graphql/app-context.generated";
import { getSdk as getMcpAuthenticateTeamSdk } from "@/api/mcp/graphql/authenticate-team.generated";
import { getSdk as getMcpCreateAppSdk } from "@/api/mcp/graphql/create-app.generated";
import { getSdk as getMcpSubmitAppForReviewSdk } from "@/api/mcp/graphql/submit-app-for-review.generated";
import { getSdk as getMcpTeamContextSdk } from "@/api/mcp/graphql/team-context.generated";
import { getSdk as getMcpUpdateAppMetadataSdk } from "@/api/mcp/graphql/update-app-metadata.generated";
import { getSdk as getMcpUpsertActionV4Sdk } from "@/api/mcp/graphql/upsert-action-v4.generated";
import { getSdk as getCreateDraftSdk } from "@/api/hasura/create-new-draft/graphql/create-draft.generated";
import { getSdk as getCreateLocalisationSdk } from "@/api/hasura/create-new-draft/graphql/create-localisation.generated";
import { getSdk as getFetchLocalisationsSdk } from "@/api/hasura/create-new-draft/graphql/fetch-localisations.generated";
import { SKILL_INSTRUCTIONS } from "@/api/mcp/skill";
import { getSdk as getUpdateRpStatusSdk } from "@/api/v4/rp-status/[rp_id]/graphql/update-rp-status.generated";
import { getSdk as getUpdateStagingStatusSdk } from "@/api/v4/rp-status/[rp_id]/graphql/update-staging-status.generated";
import {
  MCP_APP_IMAGE_MAP,
  type McpAppImageType,
  decodeImageBase64,
  fetchImageFromUrl,
  ImageInputError,
  tryDeleteAppImage,
  uploadAppImage,
} from "@/api/helpers/app-image-storage";
import { checkRateLimit } from "@/api/helpers/rate-limit";
import { CategoryNameIterable } from "@/lib/categories";
import { logger } from "@/lib/logger";
import { getImageEndpoint } from "@/lib/utils";
import { mainAppStoreFormReviewSubmitSchema } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppStore/FormSchema/form-schema";
import { LocalisationData } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppStore/types/AppStoreFormTypes";
import {
  encodeDescription,
  getSupportType,
  parseDescription,
} from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppStore/utils";
import {
  getLocalisationFormValues,
  transformMailtoToRawEmail,
} from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppStore/utils/dataTransforms";
import { getSdk as getReviewAppMetadataSdk } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/graphql/server/fetch-review-app-metadata.generated";
import { Wallet } from "ethers";
import { GraphQLClient } from "graphql-request";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method?: string;
  params?: any;
};

type McpAuthContext = {
  teamId: string;
  apiKeyId: string;
};

type ToolContext = McpAuthContext & {
  client: GraphQLClient;
};

type McpAppContextApp = Awaited<
  ReturnType<ReturnType<typeof getMcpAppContextSdk>["McpAppContext"]>
>["app"][number];
type McpEditableAppMetadata = McpAppContextApp["app_metadata"][number];
type McpVerifiedAppMetadata = McpAppContextApp["verified_app_metadata"][number];

class McpError extends Error {
  constructor(
    message: string,
    public code = -32000,
    public data?: unknown,
  ) {
    super(message);
  }
}

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
      "Create a managed World ID 4.0 RP for an app. The platform creates a KMS-backed manager key, submits the on-chain registration transaction, and (on production) duplicates to the staging contract. A new signer wallet is generated server-side; its private key is returned ONCE in the response — the portal does not retain it.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: { type: "string" },
        signer_private_key: {
          type: "string",
          description:
            "Optional. If provided, the resulting wallet's address is registered as the on-chain signer. If omitted, a fresh wallet is generated server-side and the private key is returned once.",
        },
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
    name: "get_world_id_registration_status",
    description:
      "Fetch and sync World ID RP registration status from the registry contracts for an app.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: { type: "string" },
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
    description:
      "Update Mini App portal settings, app store metadata, and Advanced/Permissions configuration (contracts, permit2 tokens, notification limits, etc.).",
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
        description: {
          type: "string",
          description:
            "Stored verbatim. Prefer description_overview for the human-readable text shown in the app store; the server will JSON-encode it for you.",
        },
        description_overview: {
          type: "string",
          description:
            "App store overview shown to users. Required for review submission. Server JSON-encodes this (with description_how_it_works / description_connect) into app_metadata.description.",
        },
        description_how_it_works: { type: "string" },
        description_connect: { type: "string" },
        world_app_description: { type: "string" },
        world_app_button_text: { type: "string" },
        supported_countries: { type: "array", items: { type: "string" } },
        supported_languages: { type: "array", items: { type: "string" } },
        is_android_only: { type: "boolean" },
        is_developer_allow_listing: { type: "boolean" },
        is_for_humans_only: { type: "boolean" },
        app_mode: {
          type: "string",
          enum: ["external", "mini-app", "native"],
        },
        contracts: { type: "array", items: { type: "string" } },
        permit2_tokens: { type: "array", items: { type: "string" } },
        whitelisted_addresses: {
          type: "array",
          items: { type: "string" },
          description:
            "Wallet addresses allowed to interact with the mini app. Pass an empty array to disable the whitelist.",
        },
        associated_domains: { type: "array", items: { type: "string" } },
        can_import_all_contacts: { type: "boolean" },
        can_use_attestation: { type: "boolean" },
        max_notifications_per_day: {
          type: "string",
          enum: ["0", "1", "2", "unlimited"],
          description:
            'How many notifications the mini app may send per day. Pass "unlimited" for no cap (automatically sets is_allowed_unlimited_notifications: true).',
        },
      },
      required: ["app_id"],
      additionalProperties: false,
    },
  },
  {
    name: "upload_app_image",
    description:
      "Upload an app image (logo, hero, content_card, meta_tag, showcase_1/2/3) from a public HTTPS source URL or base64 data and set the corresponding app_metadata field. Image must be PNG or JPEG, ≤500KB. Required for app store submissions which gate on logo_img_url and (for Mini Apps) content_card_image_url.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: { type: "string" },
        image_type: {
          type: "string",
          enum: [
            "logo",
            "hero",
            "content_card",
            "meta_tag",
            "showcase_1",
            "showcase_2",
            "showcase_3",
          ],
        },
        source_url: {
          type: "string",
          description:
            "Public HTTPS URL the server fetches. Must resolve to a public address (loopback/private/link-local rejected). Redirects are not followed. Use this OR image_base64.",
        },
        image_base64: {
          type: "string",
          description:
            "Base64-encoded PNG/JPEG bytes. Use this OR source_url. The server detects the format from magic bytes; no separate content_type input is needed.",
        },
      },
      required: ["app_id", "image_type"],
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
    signer_private_key: yup.string().optional(),
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

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const HTTPS_URL_REGEX = /^https:\/\/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;
const CONFIGURE_MINI_APP_IMAGE_FIELDS = [
  "logo_img_url",
  "hero_image_url",
  "meta_tag_image_url",
  "showcase_img_urls",
  "content_card_image_url",
] as const;

// Reject characters that either (a) get split apart by Postgres array parsing
// (commas) or (b) require escaping in PG array literals and would otherwise
// produce malformed text (`"` and `\`). Keeps configure_mini_app's array
// fields safe even if a per-item regex is loose.
const PG_ARRAY_UNSAFE_CHAR_REGEX = /[",\\]/;

const noUnsafeCharsTest = (label: string) =>
  ({
    name: "no-pg-unsafe-chars",
    message: `${label} cannot contain commas, double quotes, or backslashes`,
    test: (value: string | undefined) =>
      value === undefined || !PG_ARRAY_UNSAFE_CHAR_REGEX.test(value),
  }) as const;

const ethAddressArraySchema = (label: string) =>
  yup
    .array()
    .of(
      yup
        .string()
        .matches(
          ETH_ADDRESS_REGEX,
          `${label} must be 0x followed by 40 hex characters`,
        )
        .test(noUnsafeCharsTest(label))
        .required(),
    )
    .optional();

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
    description_overview: yup.string().optional(),
    description_how_it_works: yup.string().optional(),
    description_connect: yup.string().optional(),
    world_app_description: yup.string().optional(),
    world_app_button_text: yup.string().optional(),
    supported_countries: yup.array().of(yup.string().length(2)).optional(),
    supported_languages: yup.array().of(yup.string()).optional(),
    is_android_only: yup.boolean().optional(),
    is_developer_allow_listing: yup.boolean().optional(),
    is_for_humans_only: yup.boolean().optional(),
    app_mode: yup.string().oneOf(["external", "mini-app", "native"]).optional(),
    contracts: ethAddressArraySchema("Each contract address"),
    permit2_tokens: ethAddressArraySchema("Each permit2 token address"),
    whitelisted_addresses: ethAddressArraySchema("Each whitelisted address"),
    associated_domains: yup
      .array()
      .of(
        yup
          .string()
          .matches(
            HTTPS_URL_REGEX,
            "Each associated domain must be a valid HTTPS URL",
          )
          .test(noUnsafeCharsTest("Each associated domain"))
          .required(),
      )
      .optional(),
    can_import_all_contacts: yup.boolean().optional(),
    can_use_attestation: yup.boolean().optional(),
    max_notifications_per_day: yup
      .mixed<"0" | "1" | "2" | "unlimited">()
      .oneOf(["0", "1", "2", "unlimited"])
      .optional(),
  })
  .noUnknown();

const submitAppSchema = yup
  .object({
    app_id: yup.string().required(),
    confirm_submission: yup.boolean().oneOf([true]).required(),
    changelog: yup.string().default("Submitted via MCP"),
    is_developer_allow_listing: yup.boolean().optional(),
  })
  .noUnknown();

const uploadAppImageSchema = yup
  .object({
    app_id: yup.string().required(),
    image_type: yup
      .string()
      .oneOf(Object.keys(MCP_APP_IMAGE_MAP) as McpAppImageType[])
      .required(),
    source_url: yup
      .string()
      .url()
      .matches(/^https:\/\//, "source_url must use https://")
      .optional(),
    image_base64: yup.string().optional(),
  })
  .test(
    "exactly-one-source",
    "Provide exactly one of source_url or image_base64",
    (value) => {
      const hasUrl = Boolean(value?.source_url);
      const hasBase64 = Boolean(value?.image_base64);
      return hasUrl !== hasBase64;
    },
  )
  .noUnknown();

const parseApiKey = (authorization: string | null) => {
  if (!authorization) return null;
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token?.startsWith("api_")) {
    return null;
  }
  let decoded: string;
  try {
    decoded = Buffer.from(token.slice("api_".length), "base64").toString(
      "utf8",
    );
  } catch {
    return null;
  }
  const [id, secret] = decoded.split(":");
  if (!id || !secret) return null;
  return { id, secret };
};

const authenticate = async (req: NextRequest): Promise<McpAuthContext> => {
  const credentials = parseApiKey(req.headers.get("authorization"));
  if (!credentials) {
    throw new McpError("API key is required.", -32001);
  }

  const serviceClient = await getAPIServiceGraphqlClient();
  let apiKey;
  try {
    const result = await getMcpAuthenticateTeamSdk(
      serviceClient,
    ).McpAuthenticateTeam({ id: credentials.id });
    apiKey = result.api_key_by_pk;
  } catch {
    throw new McpError("API key is not valid.", -32001);
  }

  if (
    !apiKey ||
    !apiKey.is_active ||
    !verifyHashedSecret(apiKey.id, credentials.secret, apiKey.api_key)
  ) {
    throw new McpError("API key is not valid.", -32001);
  }

  return { teamId: apiKey.team_id, apiKeyId: apiKey.id };
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

const rejectConfigureMiniAppImageFields = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;

  const fields = CONFIGURE_MINI_APP_IMAGE_FIELDS.filter((field) =>
    Object.prototype.hasOwnProperty.call(value, field),
  );

  if (fields.length === 0) return;

  throw new McpError(
    "Use upload_app_image to upload and set app image fields.",
    -32602,
    { fields },
  );
};

const content = (value: unknown) => ({
  content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
});

const rpStatusEndpoint = (rpId: string) => `/api/v4/rp-status/${rpId}`;

const requireApp = async (
  client: GraphQLClient,
  teamId: string,
  appId: string,
): Promise<McpAppContextApp> => {
  const data = await getMcpAppContextSdk(client).McpAppContext({
    team_id: teamId,
    app_id: appId,
  });
  const app = data.app[0];
  if (!app) {
    throw new McpError("App not found for this API key.", -32004);
  }
  return app;
};

const fileNameForDraft = (
  fileName: string | null | undefined,
  basename: string,
) => (fileName ? `${basename}.${getImageEndpoint(fileName)}` : "");

const showcaseInsertValueForDraft = (
  fileNames: string[] | null | undefined,
) => {
  if (!fileNames?.length) {
    return null;
  }

  return `{${fileNames.join(",")}}`;
};

const showcaseFileNamesForDraft = (fileNames: string[] | null | undefined) => {
  if (!fileNames?.length) {
    return { insertValue: null, metadataValue: null };
  }

  const metadataValue = fileNames.map(
    (fileName, index) =>
      `showcase_img_${index + 1}.${getImageEndpoint(fileName)}`,
  );
  return {
    // Hasura accepts Postgres array text here; this mirrors the dashboard's
    // create_new_draft action so approved image filenames are preserved.
    insertValue: showcaseInsertValueForDraft(metadataValue),
    metadataValue,
  };
};

type McpDraftImagePatch = Partial<
  Pick<
    McpEditableAppMetadata,
    | "logo_img_url"
    | "hero_image_url"
    | "meta_tag_image_url"
    | "content_card_image_url"
  >
> & {
  showcase_img_urls?: string[] | null;
};

const imagePatchForUploadedDraft = (
  verified: McpVerifiedAppMetadata,
  mapping: (typeof MCP_APP_IMAGE_MAP)[McpAppImageType],
  fileName: string,
): McpDraftImagePatch => {
  if ("arrayIndex" in mapping) {
    const current =
      showcaseFileNamesForDraft(verified.showcase_img_urls).metadataValue ?? [];
    const next = [...current];
    while (next.length < mapping.arrayIndex + 1) next.push("");
    next[mapping.arrayIndex] = fileName;
    return { showcase_img_urls: next };
  }

  return { [mapping.field]: fileName } as McpDraftImagePatch;
};

const createDraftFromVerifiedMetadata = async (
  ctx: ToolContext,
  appId: string,
  verified: McpVerifiedAppMetadata,
  imagePatch: McpDraftImagePatch = {},
): Promise<McpEditableAppMetadata> => {
  const showcase = showcaseFileNamesForDraft(verified.showcase_img_urls);
  const hasPatchedShowcase = "showcase_img_urls" in imagePatch;
  const { showcase_img_urls: patchedShowcaseImgUrls, ...scalarImagePatch } =
    imagePatch;
  const showcaseCreateValue =
    hasPatchedShowcase
      ? (patchedShowcaseImgUrls ?? null)
      : showcase.insertValue;
  const showcaseMetadataValue =
    hasPatchedShowcase
      ? (patchedShowcaseImgUrls ?? null)
      : showcase.metadataValue;
  const draftValues = {
    app_id: appId,
    name: verified.name,
    short_name: verified.short_name,
    logo_img_url: fileNameForDraft(verified.logo_img_url, "logo_img"),
    hero_image_url: "",
    meta_tag_image_url: fileNameForDraft(
      verified.meta_tag_image_url,
      "meta_tag_image",
    ),
    showcase_img_urls: showcaseCreateValue,
    content_card_image_url: fileNameForDraft(
      verified.content_card_image_url,
      "content_card_image",
    ),
    description: verified.description,
    world_app_description: verified.world_app_description,
    category: verified.category,
    is_developer_allow_listing: verified.is_developer_allow_listing,
    integration_url: verified.integration_url,
    app_website_url: verified.app_website_url,
    source_code_url: verified.source_code_url,
    verification_status: "unverified",
    world_app_button_text: verified.world_app_button_text,
    app_mode: verified.app_mode,
    whitelisted_addresses: verified.whitelisted_addresses ?? null,
    support_link: verified.support_link,
    supported_countries: verified.supported_countries ?? null,
    supported_languages: verified.supported_languages ?? null,
    associated_domains: verified.associated_domains ?? null,
    contracts: verified.contracts ?? null,
    permit2_tokens: verified.permit2_tokens ?? null,
    can_import_all_contacts: Boolean(verified.can_import_all_contacts),
    can_use_attestation: Boolean(verified.can_use_attestation),
    is_allowed_unlimited_notifications: Boolean(
      verified.is_allowed_unlimited_notifications,
    ),
    max_notifications_per_day: Number(verified.max_notifications_per_day ?? 0),
    is_android_only: Boolean(verified.is_android_only),
    is_for_humans_only: Boolean(verified.is_for_humans_only),
    ...scalarImagePatch,
  };

  const data = await getCreateDraftSdk(ctx.client).CreateDraft(draftValues);
  const draftId = data.insert_app_metadata_one?.id;
  if (!draftId) {
    throw new McpError("Failed to create an editable app draft.", -32603);
  }

  const { localisations } = await getFetchLocalisationsSdk(
    ctx.client,
  ).FetchLocalisations({ id: verified.id });

  for (const localisation of localisations) {
    const {
      id: _id,
      __typename: _typename,
      meta_tag_image_url,
      showcase_img_urls,
      ...copiedLocalisation
    } = localisation;

    await getCreateLocalisationSdk(ctx.client).CreateLocalisation({
      input: {
        ...copiedLocalisation,
        app_metadata_id: draftId,
        hero_image_url: "",
        meta_tag_image_url: fileNameForDraft(
          meta_tag_image_url,
          "meta_tag_image",
        ),
        showcase_img_urls:
          showcaseFileNamesForDraft(showcase_img_urls).metadataValue,
      },
    });
  }

  logPortalEvent({
    event: "app_draft_creation",
    actor: "mcp",
    team_id: ctx.teamId,
    app_id: appId,
    metadata: {
      source_app_metadata_id: verified.id,
      draft_app_metadata_id: draftId,
    },
  });

  return {
    id: draftId,
    ...draftValues,
    showcase_img_urls: showcaseMetadataValue,
  } as McpEditableAppMetadata;
};

const getOrCreateEditableMetadata = async (
  ctx: ToolContext,
  app: McpAppContextApp,
) => {
  const metadata = app.app_metadata[0];
  if (metadata) {
    return { metadata, draftCreated: false };
  }

  const verifiedMetadata = app.verified_app_metadata?.[0];
  if (!verifiedMetadata) {
    throw new McpError("Editable app metadata not found.", -32004);
  }

  const draft = await createDraftFromVerifiedMetadata(
    ctx,
    app.id,
    verifiedMetadata,
  );
  return { metadata: draft, draftCreated: true };
};

const syncWorldIdRegistrationStatus = async (
  input: unknown,
  ctx: ToolContext,
) => {
  const { app_id } = await parseInput(appIdSchema, input);
  const app = await requireApp(ctx.client, ctx.teamId, app_id);
  const registration = app.rp_registration[0];
  if (!registration) {
    throw new McpError("World ID is not configured for this app.", -32004);
  }

  const productionContractAddress = process.env.RP_REGISTRY_CONTRACT_ADDRESS;
  if (!productionContractAddress) {
    throw new McpError("RP Registry is not configured.", -32603);
  }

  const rpId = registration.rp_id;
  const numericRpId = parseRpId(rpId);
  const currentProductionStatus = registration.status as string;
  const currentStagingStatus =
    (registration.staging_status as string | null | undefined) ?? null;

  let productionStatus = currentProductionStatus;
  let productionInitialized = false;

  try {
    const productionRp = await getRpFromContract(
      numericRpId,
      productionContractAddress,
    );
    productionInitialized = productionRp.initialized;

    if (productionRp.initialized) {
      productionStatus = mapOnChainToDbStatus(
        productionRp.initialized,
        productionRp.active,
      );
    }
  } catch (error) {
    logger.error("Failed to fetch MCP RP status from production contract", {
      error,
      app_id,
      rp_id: rpId,
    });
    throw new McpError("Failed to fetch production RP status.", -32603);
  }

  if (productionInitialized && productionStatus !== currentProductionStatus) {
    await getUpdateRpStatusSdk(ctx.client).UpdateRpStatus({
      rp_id: rpId,
      status: productionStatus,
    });
  }

  const stagingContractAddress =
    process.env.RP_REGISTRY_STAGING_CONTRACT_ADDRESS || null;
  let stagingStatus: string | null = currentStagingStatus;
  let stagingInitialized: boolean | null = null;
  let stagingSynced = false;

  if (stagingContractAddress) {
    try {
      const stagingRp = await getRpFromContract(
        numericRpId,
        stagingContractAddress,
      );
      stagingInitialized = stagingRp.initialized;

      if (stagingRp.initialized) {
        const expectedSigner = registration.signer_address;
        const canTrustOnChainStaging =
          !expectedSigner ||
          normalizeAddress(stagingRp.signer).toLowerCase() ===
            normalizeAddress(expectedSigner).toLowerCase();

        const mappedStagingStatus = mapOnChainToDbStatus(
          stagingRp.initialized,
          stagingRp.active,
        );
        stagingStatus = canTrustOnChainStaging
          ? mappedStagingStatus
          : currentStagingStatus ?? mappedStagingStatus;

        if (canTrustOnChainStaging && stagingStatus !== currentStagingStatus) {
          await getUpdateStagingStatusSdk(ctx.client).UpdateStagingStatus({
            rp_id: rpId,
            staging_status: stagingStatus,
          });
          stagingSynced = true;
        }
      } else {
        stagingStatus = "pending";
      }
    } catch (error) {
      logger.error("Failed to fetch MCP RP status from staging contract", {
        error,
        app_id,
        rp_id: rpId,
      });
      stagingStatus = "failed";
    }
  }

  return content({
    rp_id: rpId,
    app_id,
    mode: registration.mode,
    production_status: productionStatus,
    staging_status: stagingStatus,
    synced: {
      production:
        productionInitialized && productionStatus !== currentProductionStatus,
      staging: stagingSynced,
    },
    on_chain: {
      production_initialized: productionInitialized,
      staging_initialized: stagingInitialized,
    },
    status_endpoint: rpStatusEndpoint(rpId),
    verify_endpoint: `/api/v4/verify/${rpId}`,
    proof_context_endpoint: `/api/v4/proof-context/${rpId}`,
  });
};

const makeWallet = (privateKey?: string) => {
  let wallet;
  try {
    wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
  } catch {
    throw new McpError(
      "Invalid signer_private_key: must be a 32-byte hex-encoded private key.",
      -32602,
    );
  }
  return {
    private_key: wallet.privateKey,
    signer_address: wallet.address,
  };
};

// Map a managed-flow helper failure to the JSON-RPC error code the MCP
// surfaces. Caller-fixable problems (already registered, wrong mode, feature
// flag off) become -32004 (operation not allowed in current state); anything
// platform-side becomes -32603 so clients know to retry / escalate.
const REGISTRATION_FLOW_RPC_CODE: Record<
  Exclude<ManagedRegistrationResult, { ok: true }>["code"],
  number
> = {
  feature_not_enabled: -32004,
  already_registered: -32004,
  config_error: -32603,
  kms_error: -32603,
  submission_error: -32603,
  db_error: -32603,
};

const ROTATION_FLOW_RPC_CODE: Record<
  Exclude<ManagedRotationResult, { ok: true }>["code"],
  number
> = {
  feature_not_enabled: -32004,
  rp_not_registered: -32004,
  self_managed_mode: -32004,
  rotation_in_progress: -32004,
  config_error: -32603,
  submission_error: -32603,
  db_error: -32603,
};

const rotateWorldIdSigningKey = async (input: unknown, ctx: ToolContext) => {
  const args = await parseInput(
    appIdSchema.shape({ signer_private_key: yup.string().optional() }),
    input,
  );
  // requireApp validates the app belongs to the API key's team before we
  // hand off to the rotation flow (which trusts the caller's auth).
  const app = await requireApp(ctx.client, ctx.teamId, args.app_id);
  const registration = app.rp_registration[0];
  if (!registration) {
    throw new McpError("World ID is not configured for this app.", -32004);
  }

  const signingKey = makeWallet(args.signer_private_key);

  const result = await submitManagedSignerRotation({
    client: ctx.client,
    appId: args.app_id,
    newSignerAddress: signingKey.signer_address,
  });

  if (!result.ok) {
    throw new McpError(result.detail, ROTATION_FLOW_RPC_CODE[result.code], {
      reason: result.code,
    });
  }

  return content({
    rp_id: result.rpIdString,
    new_signer_address: result.newSignerAddress,
    old_signer_address: result.oldSignerAddress,
    operation_hash: result.operationHash,
    status: result.status,
    signing_key: signingKey,
    status_endpoint: rpStatusEndpoint(result.rpIdString),
    warning:
      "Store private_key securely. It is not recoverable after this response. The on-chain rotation is pending — poll status_endpoint until it returns 'registered'.",
  });
};

const tools = {
  get_team_context: async (_input, ctx) => {
    const data = await getMcpTeamContextSdk(ctx.client).McpTeamContext({
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
      status_endpoint: app.rp_registration[0]
        ? rpStatusEndpoint(app.rp_registration[0].rp_id)
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

    const data = await getMcpCreateAppSdk(ctx.client).McpCreateApp({
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
        status_endpoint: rpStatusEndpoint(existingRegistration.rp_id),
        message:
          "World ID is already configured. Use rotate_world_id_signing_key to generate a new private signing key.",
      });
    }

    // Always generate a wallet — managed mode requires a real signer
    // address up front. If the caller passed a private key we honor it,
    // otherwise we mint a fresh one and return it once.
    const signingKey = makeWallet(args.signer_private_key);
    const appName = app.app_metadata?.[0]?.name || app.name || "";

    const result = await submitManagedRpRegistration({
      client: ctx.client,
      appId: args.app_id,
      teamId: ctx.teamId,
      signerAddress: signingKey.signer_address,
      appName,
    });

    if (!result.ok) {
      throw new McpError(
        result.detail,
        REGISTRATION_FLOW_RPC_CODE[result.code],
        { reason: result.code },
      );
    }

    return content({
      rp_id: result.rpIdString,
      manager_address: result.managerAddress,
      signer_address: result.signerAddress,
      operation_hash: result.operationHash,
      status: result.status,
      staging_operation_hash: result.stagingOperationHash,
      staging_status: result.stagingStatus,
      signing_key: signingKey,
      verify_endpoint: `/api/v4/verify/${result.rpIdString}`,
      proof_context_endpoint: `/api/v4/proof-context/${result.rpIdString}`,
      status_endpoint: rpStatusEndpoint(result.rpIdString),
      warning:
        "Private keys are returned only at generation/rotation time. Store the private_key securely in the app environment. The on-chain registration is pending — poll status_endpoint until it returns 'registered' before relying on the RP for verifications.",
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

    if (args.rotate_if_unavailable && !registration.signer_address) {
      return rotateWorldIdSigningKey({ app_id: args.app_id }, ctx);
    }

    return content({
      rp_id: registration.rp_id,
      signer_address: registration.signer_address,
      private_key: null,
      status_endpoint: rpStatusEndpoint(registration.rp_id),
      message:
        "Existing private signing keys are not recoverable. Use rotate_world_id_signing_key to generate a new key.",
    });
  },

  get_world_id_registration_status: syncWorldIdRegistrationStatus,

  rotate_world_id_signing_key: rotateWorldIdSigningKey,

  create_world_id_action: async (input, ctx) => {
    const args = await parseInput(createActionSchema, input);
    const app = await requireApp(ctx.client, ctx.teamId, args.app_id);
    const registration = app.rp_registration[0];
    if (!registration?.rp_id) {
      throw new McpError("World ID is not configured for this app.", -32004);
    }

    const data = await getMcpUpsertActionV4Sdk(ctx.client).McpUpsertActionV4({
      rp_id: registration.rp_id,
      action: args.action,
      description: args.description,
      environment: args.environment,
    });

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
    rejectConfigureMiniAppImageFields(input);
    const args = await parseInput(configureMiniAppSchema, input);
    const app = await requireApp(ctx.client, ctx.teamId, args.app_id);
    const { metadata, draftCreated } = await getOrCreateEditableMetadata(
      ctx,
      app,
    );
    if (metadata.verification_status !== "unverified") {
      throw new McpError("Only unverified app metadata can be edited.", -32004);
    }

    const {
      app_id: _appId,
      contracts,
      permit2_tokens,
      whitelisted_addresses,
      associated_domains,
      max_notifications_per_day,
      app_mode,
      description,
      description_overview,
      description_how_it_works,
      description_connect,
      ...rest
    } = args;

    // Build Postgres array text directly from the input array.
    // Do NOT round-trip through a comma-joined string + formatMultipleStringInput:
    // that helper splits on commas and would shred any element that happens to
    // contain a comma into multiple stored values. Each element is also
    // PG-quote-escaped (`\` -> `\\`, `"` -> `\"`) so an embedded quote or
    // backslash that slips past validation doesn't produce malformed array
    // literals. Validation should normally reject these characters upfront.
    const toPgArrayText = (arr: string[] | undefined) => {
      if (arr === undefined) return undefined;
      if (arr.length === 0) return null;
      const escapeForPgArray = (s: string) =>
        s.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `{${arr.map((s) => `"${escapeForPgArray(s)}"`).join(",")}}`;
    };

    const advanced: Record<string, unknown> = {
      contracts: toPgArrayText(contracts),
      permit2_tokens: toPgArrayText(permit2_tokens),
      whitelisted_addresses: toPgArrayText(whitelisted_addresses),
      associated_domains: toPgArrayText(associated_domains),
      app_mode: app_mode ?? "mini-app",
    };

    if (max_notifications_per_day !== undefined) {
      const unlimited = max_notifications_per_day === "unlimited";
      advanced.is_allowed_unlimited_notifications = unlimited;
      advanced.max_notifications_per_day = unlimited
        ? 0
        : Number(max_notifications_per_day);
    }

    // app_metadata.description is a JSON-encoded string with shape
    // { description_overview, description_how_it_works, description_connect }.
    // Accept the sub-fields directly so the agent doesn't need to construct
    // the JSON. configure_mini_app behaves like a patch endpoint elsewhere
    // (omitted fields preserve existing values) so we mirror that here:
    // missing sub-fields fall back to whatever's already stored, NOT to "".
    // Explicit `description` (legacy / advanced) wins if both are provided.
    if (
      description === undefined &&
      (description_overview !== undefined ||
        description_how_it_works !== undefined ||
        description_connect !== undefined)
    ) {
      const existing = parseDescription(
        ((metadata as { description?: string | null }).description ?? "") || "",
      );
      advanced.description = encodeDescription(
        description_overview ?? existing.description_overview,
        description_how_it_works ?? existing.description_how_it_works,
        description_connect ?? existing.description_connect,
      );
    } else if (description !== undefined) {
      advanced.description = description;
    }

    const set = Object.fromEntries(
      Object.entries({ ...rest, ...advanced }).filter(
        ([, value]) => value !== undefined,
      ),
    );

    const data = await getMcpUpdateAppMetadataSdk(
      ctx.client,
    ).McpUpdateAppMetadata({
      app_metadata_id: metadata.id,
      set,
    });

    return content({
      app_metadata: data.update_app_metadata_by_pk,
      draft_created: draftCreated,
    });
  },

  upload_app_image: async (input, ctx) => {
    const args = await parseInput(uploadAppImageSchema, input);
    const app = await requireApp(ctx.client, ctx.teamId, args.app_id);
    let metadata = app.app_metadata[0] ?? null;
    const verifiedMetadata = app.verified_app_metadata?.[0];
    if (metadata && metadata.verification_status !== "unverified") {
      throw new McpError("Only unverified app metadata can be edited.", -32004);
    }
    if (!metadata && !verifiedMetadata) {
      throw new McpError("Editable app metadata not found.", -32004);
    }

    // Per-API-key upload throttle. Caps cost from a single key looping the
    // tool: 60 uploads/min and 500/day. Falls open if Redis is unavailable.
    const limit = await checkRateLimit({
      scope: "mcp_upload_app_image",
      key: ctx.apiKeyId,
      windows: [
        { label: "minute", limit: 60, periodSeconds: 60 },
        { label: "day", limit: 500, periodSeconds: 86_400 },
      ],
    });
    if (!limit.ok) {
      throw new McpError(
        `Rate limit exceeded for upload_app_image (${limit.window.limit}/${limit.window.label}). Retry in ${limit.resetIn}s.`,
        -32029,
        { retry_after_seconds: limit.resetIn, window: limit.window.label },
      );
    }

    // Resolve the image bytes + content type from either source. The helpers
    // perform SSRF-safe fetching (https only, no redirects, public addrs),
    // size-cap streaming, and authoritative magic-number detection so we
    // never trust the caller-provided content_type. ImageInputError is the
    // caller-fixable signal we map to JSON-RPC -32602.
    let body: Buffer;
    let contentType: "image/png" | "image/jpeg";

    try {
      const resolved = args.source_url
        ? await fetchImageFromUrl(args.source_url)
        : decodeImageBase64(args.image_base64!);
      body = resolved.body;
      contentType = resolved.contentType;
    } catch (error) {
      if (error instanceof ImageInputError) {
        throw new McpError(error.message, -32602);
      }
      logger.error("Failed to resolve MCP app image bytes", {
        error,
        app_id: args.app_id,
        team_id: ctx.teamId,
        image_type: args.image_type,
        source: args.source_url ? "url" : "base64",
      });
      throw new McpError("Failed to read image bytes.", -32603);
    }

    let uploadResult: Awaited<ReturnType<typeof uploadAppImage>>;
    try {
      uploadResult = await uploadAppImage({
        appId: args.app_id,
        imageType: args.image_type as McpAppImageType,
        body,
        contentType,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Size / empty errors thrown by the helper are caller-fixable.
      if (
        message.includes("empty") ||
        message.includes("maximum") ||
        message.includes("bytes")
      ) {
        throw new McpError(message, -32602);
      }
      logger.error("Failed to upload MCP app image", {
        error,
        app_id: args.app_id,
        team_id: ctx.teamId,
        image_type: args.image_type,
      });
      throw new McpError("Failed to upload image to storage.", -32603);
    }

    const { fileName, objectKey, mapping, sizeBytes } = uploadResult;

    if (!metadata) {
      try {
        metadata = await createDraftFromVerifiedMetadata(
          ctx,
          app.id,
          verifiedMetadata!,
          imagePatchForUploadedDraft(verifiedMetadata!, mapping, fileName),
        );
      } catch (error) {
        await tryDeleteAppImage(objectKey);
        logger.error("MCP app image uploaded to S3 but draft creation failed.", {
          error,
          app_id: args.app_id,
          team_id: ctx.teamId,
          image_type: args.image_type,
          object_key: objectKey,
        });
        throw new McpError(
          "Image was uploaded but draft creation failed. The S3 object was rolled back; retry the same call.",
          -32603,
          { committed: false, file_name: fileName },
        );
      }

      return content({
        committed: true,
        app_id: args.app_id,
        image_type: args.image_type,
        field: mapping.field,
        file_name: fileName,
        s3_key: objectKey,
        size_bytes: sizeBytes,
        content_type: contentType,
        draft_created: true,
        app_metadata: metadata,
      });
    }

    let set: Record<string, unknown>;
    let priorReferencedFileName: string | undefined;
    if ("arrayIndex" in mapping) {
      const current = (metadata.showcase_img_urls ?? []) as string[];
      const slot = current[mapping.arrayIndex];
      priorReferencedFileName = typeof slot === "string" ? slot : undefined;
      const next = [...current];
      while (next.length < mapping.arrayIndex + 1) next.push("");
      next[mapping.arrayIndex] = fileName;
      set = { showcase_img_urls: next };
    } else {
      const raw = (metadata as Record<string, unknown>)[mapping.field];
      priorReferencedFileName = typeof raw === "string" ? raw : undefined;
      set = { [mapping.field]: fileName };
    }

    // S3 upload already succeeded above. The deterministic object key means
    // a replace-upload may have just overwritten an asset that the existing
    // metadata field already references; in that case deleting on failure
    // would leave the existing reference dangling. The prior bytes are gone
    // either way, so the safer rollback is to keep the new bytes in place
    // (effectively partial success — the asset is updated even though the
    // patch failed) and let the caller retry. When the prior metadata
    // referenced something else (or nothing), we DELETE the orphan we just
    // wrote. Retries are idempotent (same key, same bytes).
    let data;
    try {
      data = await getMcpUpdateAppMetadataSdk(ctx.client).McpUpdateAppMetadata({
        app_metadata_id: metadata.id,
        set,
      });
    } catch (error) {
      const wouldOrphanReference = priorReferencedFileName === fileName;
      if (!wouldOrphanReference) {
        await tryDeleteAppImage(objectKey);
      }
      logger.error("MCP app image uploaded to S3 but metadata patch failed.", {
        error,
        app_id: args.app_id,
        team_id: ctx.teamId,
        image_type: args.image_type,
        object_key: objectKey,
        cleanup_skipped: wouldOrphanReference,
      });
      throw new McpError(
        wouldOrphanReference
          ? "Image was uploaded but the metadata update failed. The existing reference was preserved; retry the same call."
          : "Image was uploaded but the metadata update failed. The S3 object was rolled back; retry the same call.",
        -32603,
        { committed: false, file_name: fileName },
      );
    }

    return content({
      committed: true,
      app_id: args.app_id,
      image_type: args.image_type,
      field: mapping.field,
      file_name: fileName,
      s3_key: objectKey,
      size_bytes: sizeBytes,
      content_type: contentType,
      draft_created: false,
      app_metadata: data.update_app_metadata_by_pk,
    });
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
      throw new McpError(
        "No editable draft exists. Update Mini App metadata or upload an app image first to create a draft.",
        -32004,
      );
    }
    if (metadata.verification_status !== "unverified") {
      throw new McpError("Only unverified apps can be submitted.", -32004);
    }

    const reviewData = await getReviewAppMetadataSdk(
      ctx.client,
    ).FetchAppMetadataById({ app_metadata_id: metadata.id });
    const reviewMetadata = reviewData.app_metadata[0];
    if (!reviewMetadata) {
      throw new McpError(
        "App metadata not found or not in unverified state.",
        -32004,
      );
    }

    const localisations = getLocalisationFormValues(
      reviewMetadata,
      reviewData.localisations as LocalisationData,
    );
    const supportLinkOrEmail = reviewMetadata.support_link;
    const supportType = getSupportType(supportLinkOrEmail);
    const supportLink = supportType === "link" ? supportLinkOrEmail : "";
    const rawSupportEmail =
      supportType === "email"
        ? transformMailtoToRawEmail(supportLinkOrEmail)
        : "";

    try {
      await mainAppStoreFormReviewSubmitSchema.validate(
        {
          ...reviewMetadata,
          support_type: supportType,
          support_link: supportLink,
          support_email: rawSupportEmail,
          localisations,
        },
        {
          abortEarly: false,
          strict: true,
          stripUnknown: true,
          context: { isMiniApp: reviewMetadata.app_mode === "mini-app" },
        },
      );
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        throw new McpError(
          "App metadata is incomplete and cannot be submitted for review.",
          -32602,
          error.errors,
        );
      }
      throw error;
    }

    const isDeveloperAllowListing =
      args.is_developer_allow_listing ??
      metadata.is_developer_allow_listing ??
      false;

    const data = await getMcpSubmitAppForReviewSdk(
      ctx.client,
    ).McpSubmitAppForReview({
      app_metadata_id: metadata.id,
      is_developer_allow_listing: isDeveloperAllowListing,
      changelog: args.changelog,
    });

    logPortalEvent({
      event: "app_submission",
      actor: "mcp",
      team_id: ctx.teamId,
      app_id: args.app_id,
      metadata: {
        is_developer_allow_listing: isDeveloperAllowListing,
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
    case "get_world_id_registration_status":
    case "rotate_world_id_signing_key":
    case "create_world_id_action":
    case "configure_mini_app":
    case "upload_app_image":
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
    case "get_world_id_registration_status":
      return tools.get_world_id_registration_status(input, ctx);
    case "rotate_world_id_signing_key":
      return tools.rotate_world_id_signing_key(input, ctx);
    case "create_world_id_action":
      return tools.create_world_id_action(input, ctx);
    case "configure_mini_app":
      return tools.configure_mini_app(input, ctx);
    case "upload_app_image":
      return tools.upload_app_image(input, ctx);
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
        instructions: SKILL_INSTRUCTIONS,
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
    return jsonRpcError(
      null,
      new McpError("Invalid JSON-RPC request body.", -32700),
    );
  }

  if (message.id === undefined) {
    return new NextResponse(null, { status: 202 });
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
