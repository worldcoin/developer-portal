import { NextRequest } from "next/server";
import { getSdk as fetchApiKeySdk } from "../../v2/minikit/graphql/fetch-api-key.generated";
import { errorResponse } from "../errors";
import { getAPIServiceGraphqlClient } from "../graphql";
import { verifyHashedSecret } from "../utils";

export interface VerifyApiKeyOptions {
  req: NextRequest;
  appId: string;
}

export type VerifyApiKeyResult =
  | {
      success: true;
      teamId: string;
    }
  | {
      success: false;
      errorResponse: Response;
    };

/**
 * Verifies the API key from request headers and validates it against the provided app ID
 *
 * @param options - Object containing request and appId
 * @returns Object with success flag, error response (if any), and teamId (if successful)
 */
export const verifyApiKey = async (
  options: VerifyApiKeyOptions,
): Promise<VerifyApiKeyResult> => {
  const { req, appId } = options;

  const api_key = req.headers.get("authorization")?.split(" ")[1];

  if (!api_key) {
    return {
      success: false,
      errorResponse: errorResponse({
        statusCode: 401,
        code: "unauthorized",
        detail: "API key is required.",
        attribute: "api_key",
        req,
      }),
    };
  }

  const keyValue = api_key.replace(/^api_/, "");
  const serviceClient = await getAPIServiceGraphqlClient();

  const base64ApiKey = Buffer.from(keyValue, "base64").toString("utf8");
  const [id, secret] = base64ApiKey.split(":");

  const { api_key_by_pk } = await fetchApiKeySdk(serviceClient).FetchAPIKey({
    id,
    appId,
  });

  if (!api_key_by_pk) {
    return {
      success: false,
      errorResponse: errorResponse({
        statusCode: 404,
        code: "not_found",
        detail: "API key not found.",
        attribute: "api_key",
        req,
        app_id: appId,
      }),
    };
  }

  if (!api_key_by_pk.is_active) {
    return {
      success: false,
      errorResponse: errorResponse({
        statusCode: 400,
        code: "api_key_inactive",
        detail: "API key is inactive.",
        attribute: "api_key",
        req,
        app_id: appId,
      }),
    };
  }

  if (!api_key_by_pk.team.apps.some((a) => a.id === appId)) {
    return {
      success: false,
      errorResponse: errorResponse({
        statusCode: 403,
        code: "invalid_app",
        detail: "API key is not valid for this app.",
        attribute: "api_key",
        req,
        app_id: appId,
      }),
    };
  }

  const isAPIKeyValid = verifyHashedSecret(
    api_key_by_pk.id,
    secret,
    api_key_by_pk.api_key,
  );

  if (!isAPIKeyValid) {
    return {
      success: false,
      errorResponse: errorResponse({
        statusCode: 403,
        code: "invalid_api_key",
        detail: "API key is not valid.",
        attribute: "api_key",
        req,
        app_id: appId,
      }),
    };
  }

  // API key is valid
  return {
    success: true,
    teamId: api_key_by_pk.team.id,
  };
};
