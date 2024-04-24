import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { generateExternalNullifier } from "@/lib/hashing";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as createDynamicActionSdk } from "./graphql/create-dynamic-action.generated";
import { getSdk as fetchApiKeySdk } from "./graphql/fetch-api-key.generated";

const createActionBodySchema = yup.object({
  app_id: yup.string().strict().required(),
  action: yup.string().strict().required(),
});

export const POST = async (req: NextRequest) => {
  const body = await req.json();
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

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema: createActionBodySchema,
    value: body,
  });

  if (!isValid) {
    return handleError(req);
  }

  const { app_id } = parsedParams;
  const base64ApiKey = Buffer.from(api_key, "base64").toString("utf-8");
  const [id, secret] = base64ApiKey.split(":");
  const client = await getAPIServiceGraphqlClient();

  const { api_key_by_pk } = await fetchApiKeySdk(client).VerifyFetchAPIKey({
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
    });
  }

  if (!api_key_by_pk.is_active) {
    return errorResponse({
      statusCode: 400,
      code: "api_key_inactive",
      detail: "API key is inactive.",
      attribute: "api_key",
      req,
    });
  }

  if (!api_key_by_pk.team.apps.some((a) => a.id === app_id)) {
    return errorResponse({
      statusCode: 403,
      code: "invalid_app",
      detail: "API key is not valid for this app.",
      attribute: "api_key",
      req,
    });
  }

  const isAPIKeyValid = verifyHashedSecret(
    app_id,
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
    });
  }

  const external_nullifier = generateExternalNullifier(
    app_id as `app_${string}`,
    parsedParams.action,
  ).digest;

  const { insert_action_one } = await createDynamicActionSdk(
    client,
  ).CreateDynamicAction({
    app_id: app_id,
    action: parsedParams.action,
    external_nullifier,
  });

  if (!insert_action_one) {
    return errorResponse({
      statusCode: 500,
      code: "internal_server_error",
      detail: "Action can't be created.",
      attribute: "action",
      req,
    });
  }

  return NextResponse.json({ action: insert_action_one }, { status: 200 });
};
