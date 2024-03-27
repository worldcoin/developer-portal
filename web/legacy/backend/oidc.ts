import { logger } from "@/legacy/lib/logger";
import { ActionModel, AppModel, RedirectModel } from "@/legacy/lib/models";
import { IInternalError, OIDCFlowType, OIDCResponseType } from "@/lib/types";
import { gql } from "@apollo/client";
import { VerificationLevel } from "@worldcoin/idkit-core";
import crypto from "crypto";
import { getAPIServiceClient } from "./graphql";
import { verifyHashedSecret } from "./utils";

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

export const fetchOIDCAppQuery = gql`
  query FetchOIDCAppQuery($app_id: String!, $redirect_uri: String!) {
    app(
      where: {
        id: { _eq: $app_id }
        status: { _eq: "active" }
        is_archived: { _eq: false }
        engine: { _eq: "cloud" }
      }
    ) {
      id
      is_staging
      actions(where: { action: { _eq: "" } }) {
        id
        external_nullifier
        status
        redirects(where: { redirect_uri: { _eq: $redirect_uri } }) {
          redirect_uri
        }
      }
    }
  }
`;

type FetchOIDCAppResult = {
  app: Array<
    Pick<AppModel, "id" | "is_staging"> & {
      actions?: Array<
        Pick<ActionModel, "external_nullifier" | "status" | "id"> & {
          redirects: Array<Pick<RedirectModel, "redirect_uri">>;
        }
      >;
    }
  >;
};

export const insertAuthCodeQuery = gql`
  mutation InsertAuthCode(
    $auth_code: String!
    $code_challenge: String
    $code_challenge_method: String
    $expires_at: timestamptz!
    $nullifier_hash: String!
    $app_id: String!
    $verification_level: String!
    $scope: jsonb!
    $nonce: String
    $redirect_uri: String
  ) {
    insert_auth_code_one(
      object: {
        auth_code: $auth_code
        code_challenge: $code_challenge
        code_challenge_method: $code_challenge_method
        expires_at: $expires_at
        nullifier_hash: $nullifier_hash
        app_id: $app_id
        verification_level: $verification_level
        scope: $scope
        nonce: $nonce
        redirect_uri: $redirect_uri
      }
    ) {
      auth_code
      nonce
    }
  }
`;

interface OIDCApp {
  id: AppModel["id"];
  is_staging: AppModel["is_staging"];
  external_nullifier: ActionModel["external_nullifier"];
  action_id: ActionModel["id"];
  registered_redirect_uri?: string;
}

export const fetchOIDCApp = async (
  app_id: string,
  redirect_uri: string,
): Promise<{ app?: OIDCApp; error?: IInternalError }> => {
  const client = await getAPIServiceClient();
  const { data } = await client.query<FetchOIDCAppResult>({
    query: fetchOIDCAppQuery,
    variables: { app_id, redirect_uri },
  });

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

  delete sanitizedApp.actions;

  return {
    app: {
      ...sanitizedApp,
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

  const client = await getAPIServiceClient();

  const { data } = await client.mutate<{
    insert_auth_code_one: {
      auth_code: string;
      code_challenge?: string;
      code_challenge_method?: string;
      redirect_uri: string;
    };
  }>({
    mutation: insertAuthCodeQuery,
    variables: {
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
    },
  });

  if (data?.insert_auth_code_one.auth_code !== auth_code) {
    throw new Error("Failed to generate auth code.");
  }

  return auth_code;
};

const fetchAppSecretQuery = gql`
  query FetchAppSecretQuery($app_id: String!) {
    app(
      where: {
        id: { _eq: $app_id }
        status: { _eq: "active" }
        is_archived: { _eq: false }
        engine: { _eq: "cloud" }
      }
    ) {
      id
      actions(limit: 1, where: { action: { _eq: "" } }) {
        client_secret
      }
    }
  }
`;

type FetchAppSecretResult = {
  app: Array<
    Pick<AppModel, "id"> & {
      actions?: Array<Pick<ActionModel, "client_secret">>;
    }
  >;
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
  const client = await getAPIServiceClient();
  const { data } = await client.query<FetchAppSecretResult>({
    query: fetchAppSecretQuery,
    variables: { app_id },
  });

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

export const fetchRedirectCountQuery = gql`
  query FetchRedirectCountQuery($app_id: String) {
    action(where: { app_id: { _eq: $app_id }, action: { _eq: "" } }) {
      redirect_count
    }
  }
`;

type FetchRedirectCountResult = {
  action: Array<Pick<ActionModel, "redirect_count">>;
};

export const fetchRedirectCount = async (app_id: string): Promise<number> => {
  const client = await getAPIServiceClient();
  const { data } = await client.query<FetchRedirectCountResult>({
    query: fetchRedirectCountQuery,
    variables: { app_id },
  });
  return data.action?.[0]?.redirect_count;
};
