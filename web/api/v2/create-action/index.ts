import { errorResponse } from "@/api/helpers/errors";
import {
  getAPIKeyGraphqlClient,
  getAPIServiceGraphqlClient,
} from "@/api/helpers/graphql";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { generateExternalNullifier } from "@/lib/hashing";
import { ApolloError } from "@apollo/client";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import {
  CreateDynamicActionMutation,
  getSdk as createDynamicActionSdk,
} from "./graphql/create-dynamic-action.generated";
import { getSdk as fetchApiKeySdk } from "./graphql/fetch-api-key.generated";

const createActionBodySchema = yup
  .object({
    action: yup.string().strict().required(),
    name: yup.string().optional().default(""),
    description: yup.string().optional().default(""),
    max_verifications: yup.number().integer().min(1).optional().default(1),
  })
  .noUnknown();

const createActionParamsSchema = yup
  .object({
    app_id: yup.string().strict().required(),
  })
  .noUnknown();

export const POST = async (
  req: NextRequest,
  { params: rawParams }: { params: { app_id: string } },
) => {
  const api_key = req.headers.get("authorization")?.split(" ")[1];

  if (!api_key) {
    return errorResponse({
      statusCode: 401,
      code: "unauthorized",
      detail: "API key is required.",
      attribute: "api_key",
      req,
    });
  }

  const {
    isValid: isParamsValid,
    parsedParams: params,
    handleError: handleParamsValidationError,
  } = await validateRequestSchema({
    schema: createActionParamsSchema,
    value: rawParams,
  });

  if (!isParamsValid) {
    return handleParamsValidationError(req);
  }

  const rawBody = await req.json();

  const {
    isValid: isBodyValid,
    parsedParams: body,
    handleError: handleBodyValidationError,
  } = await validateRequestSchema({
    schema: createActionBodySchema,
    value: rawBody,
  });

  if (!isBodyValid) {
    return handleBodyValidationError(req);
  }

  const { action, app_id, name, description, max_verifications } = {
    ...body,
    ...params,
  };

  const keyValue = api_key.replace(/^api_/, "");
  const base64ApiKey = Buffer.from(keyValue, "base64").toString("utf8");
  const [id, secret] = base64ApiKey.split(":");
  const serviceClient = await getAPIServiceGraphqlClient();

  const { api_key_by_pk } = await fetchApiKeySdk(
    serviceClient,
  ).VerifyFetchAPIKey({
    id,
    appId: app_id,
  });

  if (!api_key_by_pk) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "API key not found.",
      attribute: "api_key",
      req,
      app_id,
    });
  }

  if (!api_key_by_pk.is_active) {
    return errorResponse({
      statusCode: 400,
      code: "api_key_inactive",
      detail: "API key is inactive.",
      attribute: "api_key",
      req,
      app_id,
    });
  }

  if (!api_key_by_pk.team.apps.some((a) => a.id === app_id)) {
    return errorResponse({
      statusCode: 403,
      code: "invalid_app",
      detail: "API key is not valid for this app.",
      attribute: "api_key",
      req,
      app_id,
    });
  }

  const isAPIKeyValid = verifyHashedSecret(
    api_key_by_pk.id,
    secret,
    api_key_by_pk.api_key,
  );

  if (!isAPIKeyValid) {
    return errorResponse({
      statusCode: 403,
      code: "invalid_api_key",
      detail: "API key is not valid.",
      attribute: "api_key",
      req,
      app_id,
    });
  }

  const team_id = api_key_by_pk.team.id;
  const apiKeyClient = await getAPIKeyGraphqlClient({ team_id });

  const external_nullifier = generateExternalNullifier(
    app_id as `app_${string}`,
    action,
  ).digest;

  let insertedAction: CreateDynamicActionMutation["insert_action_one"] | null =
    null;

  try {
    const { insert_action_one } = await createDynamicActionSdk(
      apiKeyClient,
    ).CreateDynamicAction({
      app_id,
      action,
      external_nullifier,
      name,
      description,
      max_verifications,
    });

    insertedAction = insert_action_one;
  } catch (error) {
    const e = error as {
      response: { errors: ApolloError["graphQLErrors"] };
    };

    if (e.response.errors[0].extensions.code === "constraint-violation") {
      return errorResponse({
        statusCode: 400,
        code: "constraint-violation",
        detail: "Action already exists.",
        attribute: "action",
        req,
        app_id,
      });
    }

    console.warn("Error creating action", e.response.errors[0]);
    return errorResponse({
      statusCode: 500,
      code: "internal_server_error",
      detail: "Action can't be created.",
      req,
      app_id,
    });
  }

  if (!insertedAction) {
    return errorResponse({
      statusCode: 500,
      code: "internal_server_error",
      detail: "Action can't be created.",
      attribute: "action",
      req,
      app_id,
    });
  }

  return NextResponse.json({ action: insertedAction }, { status: 200 });
};
