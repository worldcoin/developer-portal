import { verifyHashedSecret } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { IInternalError, OIDCFlowType, OIDCResponseType } from "@/lib/types";
import { VerificationLevel } from "@worldcoin/idkit-core";
import crypto from "crypto";
import "server-only";

import {
  FetchAppSecretQuery,
  getSdk as FetchAppSecretQuerySdk,
} from "./graphql/fetch-app-secret-query.generated";

import {
  getSdk as FetchOIDCAppSdk,
  FetchOidcAppQuery,
} from "./graphql/fetch-oidc-app.generated";

import { getAPIServiceGraphqlClient } from "../graphql";
import {
  InsertAuthCodeMutation,
  getSdk as InsertAuthCodeSdk,
} from "./graphql/insert-auth-code.generated";

export const OIDCResponseTypeMapping = {
  code: OIDCResponseType.Code,
  id_token: OIDCResponseType.JWT,
  token: OIDCResponseType.JWT,
};

export enum OIDCScopes {
  OpenID = "openid",
  Email = "email",
  Profile = "profile",
}

export enum OIDCErrorCodes {
  InvalidRequest = "invalid_request", // RFC6749 OAuth 2.0 (4.1.2.1)
  UnsupportedResponseType = "unsupported_response_type", // RFC6749 OAuth 2.0 (4.1.2.1)
  InvalidScope = "invalid_scope", // RFC6749 OAuth 2.0 (4.1.2.1)
  InvalidRedirectURI = "invalid_redirect_uri", // Custom
}

interface OIDCApp {
  id: FetchOidcAppQuery["app"][number]["id"];
  is_staging: FetchOidcAppQuery["app"][number]["is_staging"];
  external_nullifier: FetchOidcAppQuery["app"][number]["actions"][number]["external_nullifier"];
  action_id: FetchOidcAppQuery["app"][number]["actions"][number]["id"];
  registered_redirect_uri?: FetchOidcAppQuery["app"][number]["actions"][number]["redirects"][number]["redirect_uri"];
}

export const fetchOIDCApp = async (
  app_id: string,
  redirect_uri: string,
): Promise<{ app?: OIDCApp; error?: IInternalError }> => {
  const client = await getAPIServiceGraphqlClient();

  let data: FetchOidcAppQuery | null = null;

  try {
    data = await FetchOIDCAppSdk(client).FetchOIDCApp({
      app_id,
      redirect_uri,
    });
  } catch (error) {
    logger.error("fetchOIDCApp - Failed to fetch OIDC app.", { error });

    return {
      error: {
        code: "internal_server_error",
        message: "Failed to fetch OIDC app.",
        statusCode: 500,
      },
    };
  }

  if (data.app.length === 0) {
    return {
      error: {
        code: "app_not_found",
        message: "App not found or not active.",
        statusCode: 404,
      },
    };
  }

  const app = data.app[0];

  if (!app.actions?.length || app.actions[0].status === "inactive") {
    return {
      error: {
        code: "sign_in_not_enabled",
        message: "App does not have Sign in with World ID enabled.",
        statusCode: 400,
      },
    };
  }

  const external_nullifier = app.actions[0].external_nullifier;
  const action_id = app.actions[0].id;
  const registered_redirect_uri = app.actions[0].redirects[0]?.redirect_uri;

  const sanitizedApp = { ...app };
  const { actions, ...rest } = sanitizedApp;

  return {
    app: {
      ...rest,
      action_id,
      external_nullifier,
      registered_redirect_uri,
    },
  };
};

export const generateOIDCCode = async (
  app_id: string,
  nullifier_hash: string,
  verification_level: VerificationLevel,
  scope: OIDCScopes[],
  redirect_uri: string,
  code_challenge?: string,
  code_challenge_method?: string,
  nonce?: string | null,
): Promise<string> => {
  // Generate a random code
  const auth_code = crypto.randomBytes(12).toString("hex");
  const client = await getAPIServiceGraphqlClient();
  let data: InsertAuthCodeMutation | null = null;

  try {
    data = await InsertAuthCodeSdk(client).InsertAuthCode({
      app_id,
      auth_code,
      code_challenge,
      code_challenge_method,
      expires_at: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
      nullifier_hash,
      verification_level,
      scope,
      nonce,
      redirect_uri,
    });
  } catch (error) {
    logger.error("generateOIDCCode - Failed to generate auth code.", { error });
    throw error;
  }

  if (data?.insert_auth_code_one?.auth_code !== auth_code) {
    throw new Error("Failed to generate auth code.");
  }

  return auth_code;
};

// TODO: Hash secrets as passwords (e.g. `PBKDF2`) instead of HMAC
export const authenticateOIDCEndpoint = async (
  auth_header: string,
): Promise<string | null> => {
  const authToken = auth_header.replace("Basic ", "");
  const [app_id, client_secret] = Buffer.from(authToken, "base64")
    .toString()
    .split(":");

  // Fetch app
  const client = await getAPIServiceGraphqlClient();

  let data: FetchAppSecretQuery | null = null;

  try {
    data = await FetchAppSecretQuerySdk(client).FetchAppSecret({
      app_id,
    });
  } catch (error) {
    logger.error("authenticateOIDCEndpoint - Failed to fetch app.", { error });
    return null;
  }

  if (data.app.length === 0) {
    logger.info("authenticateOIDCEndpoint - App not found or not active.");
    return null;
  }

  const hmac_secret = data.app[0]?.actions?.[0]?.client_secret;

  if (!hmac_secret) {
    logger.info(
      "authenticateOIDCEndpoint - App does not have Sign in with World ID enabled.",
    );
    return null;
  }

  // ANCHOR: Verify client secret
  if (!verifyHashedSecret(app_id, client_secret, hmac_secret)) {
    logger.warn("authenticateOIDCEndpoint - Invalid client secret.");
    return null;
  }

  return app_id;
};

export function checkFlowType(responseTypes: string[]) {
  const includesAll = (requiredParams: string[]): boolean => {
    return requiredParams.every((param) => responseTypes.includes(param));
  };

  // NOTE: List of valid response types for the hybrid flow
  // Source: https://openid.net/specs/openid-connect-core-1_0.html#HybridFlowAuth:~:text=this%20value%20is%20code%C2%A0id_token%2C%20code%C2%A0token%2C%20or%20code%C2%A0id_token%C2%A0token.
  if (
    includesAll([OIDCResponseType.Code, OIDCResponseType.IdToken]) ||
    includesAll([OIDCResponseType.Code, OIDCResponseType.Token]) ||
    includesAll([
      OIDCResponseType.Code,
      OIDCResponseType.IdToken,
      OIDCResponseType.Token,
    ])
  ) {
    return OIDCFlowType.Hybrid;
  }

  // NOTE: List of valid response types for the code flow
  // Source: https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth:~:text=Authorization%20Code%20Flow%2C-,this%20value%20is%20code.,-client_id
  if (includesAll([OIDCResponseType.Code])) {
    return OIDCFlowType.AuthorizationCode;
  }

  // NOTE: List of valid response types for the implicit flow
  // Source: https://openid.net/specs/openid-connect-core-1_0.html#ImplicitFlowAuth:~:text=this%20value%20is%20id_token%C2%A0token%20or%20id_token
  if (
    includesAll([OIDCResponseType.IdToken]) ||
    includesAll([OIDCResponseType.IdToken, OIDCResponseType.Token])
  ) {
    return OIDCFlowType.Implicit;
  }

  if (includesAll([OIDCResponseType.Token])) {
    return OIDCFlowType.Token;
  }

  return null;
}
