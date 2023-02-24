import { gql } from "@apollo/client";
import { ActionModel, AppModel } from "models";
import { IInternalError } from "types";
import { getAPIServiceClient } from "./graphql";
import crypto from "crypto";

const GENERAL_SECRET_KEY = process.env.GENERAL_SECRET_KEY;
if (!GENERAL_SECRET_KEY) {
  throw new Error(
    "Improperly configured. `GENERAL_SECRET_KEY` env var must be set!"
  );
}

const fetchAppQuery = gql`
  query FetchAppQuery($app_id: String!) {
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
        external_nullifier
      }
    }

    cache(
      where: {
        _or: [
          { key: { _eq: "semaphore.wld.eth" } }
          { key: { _eq: "staging.semaphore.wld.eth" } }
        ]
      }
    ) {
      key
      value
    }
  }
`;

const insertAuthCodeQuery = gql`
  mutation InsertAuthCode(
    $auth_code: String!
    $expires_at: timestamptz!
    $nullifier_hash: String!
    $app_id: String!
  ) {
    insert_auth_code_one(
      object: {
        auth_code: $auth_code
        expires_at: $expires_at
        nullifier_hash: $nullifier_hash
        app_id: $app_id
      }
    ) {
      auth_code
    }
  }
`;

interface OIDCApp {
  id: AppModel["id"];
  is_staging: AppModel["is_staging"];
  external_nullifier: ActionModel["external_nullifier"];
  contract_address: string;
}

type FetchOIDCAppResult = {
  app: Array<
    Pick<AppModel, "id" | "is_staging"> & {
      actions?: Array<Pick<ActionModel, "external_nullifier">>;
    }
  >;
  cache: Array<{ key: string; value: string }>;
};

export const fetchOIDCApp = async (
  app_id: string
): Promise<{ app?: OIDCApp; error?: IInternalError }> => {
  const client = await getAPIServiceClient();
  const { data } = await client.query<FetchOIDCAppResult>({
    query: fetchAppQuery,
    variables: { app_id },
  });

  if (data.app.length === 0) {
    return {
      error: {
        code: "not_found",
        message: "App not found or not active.",
        statusCode: 404,
        attribute: "app_id",
      },
    };
  }

  const app = data.app[0];
  if (!app.actions?.length) {
    return {
      error: {
        code: "sign_in_not_enabled",
        message: "App does not have Sign in with World ID enabled.",
        statusCode: 400,
        attribute: "app_id",
      },
    };
  }

  const external_nullifier = app.actions[0].external_nullifier;
  delete app.actions;

  const ensName = app.is_staging
    ? "staging.semaphore.wld.eth"
    : "semaphore.wld.eth";
  const contractRecord = data.cache.find(({ key }) => key === ensName);
  if (!contractRecord) {
    return {
      error: {
        message:
          "There was an internal issue verifying this proof. Please try again.",
        code: "contract_not_found",
        statusCode: 500,
      },
    };
  }

  return {
    app: {
      ...app,
      external_nullifier,
      contract_address: contractRecord.value,
    },
  };
};

export const generateOIDCCode = async (
  app_id: string,
  nullifier_hash: string
): Promise<string> => {
  // Generate a random code
  const auth_code = crypto.randomBytes(12).toString("hex");

  const client = await getAPIServiceClient();

  const { data } = await client.mutate<{
    insert_auth_code_one: { auth_code: string };
  }>({
    mutation: insertAuthCodeQuery,
    variables: {
      app_id,
      auth_code,
      expires_at: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
      nullifier_hash,
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

export const authenticateOIDCEndpoint = async (
  auth_header: string
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
    console.info("authenticateOIDCEndpoint - App not found or not active.");
    return null;
  }

  const hmac_secret = data.app[0]?.actions?.[0]?.client_secret;

  if (!hmac_secret) {
    console.info(
      "authenticateOIDCEndpoint - App does not have Sign in with World ID enabled."
    );
    return null;
  }

  // ANCHOR: Verify client secret
  const hmac = crypto.createHmac("sha256", GENERAL_SECRET_KEY);
  hmac.update(`${app_id}.${client_secret}`);
  const candidate_secret = hmac.digest("hex");

  if (hmac_secret !== candidate_secret) {
    console.info("authenticateOIDCEndpoint - Invalid client secret.");
    return null;
  }

  return app_id;
};
