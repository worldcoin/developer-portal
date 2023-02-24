import { gql } from "@apollo/client";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
} from "api-helpers/errors";
import { getAPIServiceClient } from "api-helpers/graphql";
import crypto from "crypto";
import { NextApiRequest, NextApiResponse } from "next";

const GENERAL_SECRET_KEY = process.env.GENERAL_SECRET_KEY;
if (!GENERAL_SECRET_KEY) {
  throw new Error(
    "Improperly configured. `GENERAL_SECRET_KEY` env var must be set!"
  );
}

const insertClientQuery = gql`
  mutation InsertClient(
    $name: String = ""
    $logo_url: String = ""
    $redirect_uris: jsonb = ""
    $team_name: String = ""
  ) {
    insert_team_one(
      object: {
        apps: {
          data: {
            name: $name
            logo_url: $logo_url
            redirect_uris: $redirect_uris
          }
        }
        name: $team_name
      }
    ) {
      apps {
        id
      }
      id
    }
  }
`;

const insertSecretQuery = gql`
  mutation InsertSecret($id: String = "", $client_secret: String = "") {
    update_app_by_pk(
      pk_columns: { id: $id }
      _set: { client_secret: $client_secret }
    ) {
      id
      name
      logo_url
      redirect_uris
      client_secret
      created_at
    }
  }
`;

/**
 * Returns an OpenID Connect discovery document, according to spec
 * @param req
 * @param res
 */
export default async function handleRegister(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  if (!req.body["redirect_uris"]) {
    return errorRequiredAttribute("redirect_uris", res);
  }

  // Parse redirect_uris into array and validate
  for (const redirect in req.body.redirects) {
    try {
      const url = new URL(redirect);
      if (url.protocol !== "https:") {
        throw Error();
      }
    } catch (error) {
      return res.status(400).json({
        error: "invalid_redirect_uri",
        error_description: "One or more redirect_uri values are invalid",
      });
    }
  }

  // Insert valid client into database
  const client = await getAPIServiceClient();

  const insertClientResponse = await client.mutate({
    mutation: insertClientQuery,
    variables: {
      name: req.body.client_name,
      logo_url: req.body.logo_uri,
      redirect_uris: req.body.redirect_uris,
      team_name: req.body.client_name,
    },
  });

  if (!insertClientResponse?.data?.insert_team_one?.apps?.length) {
    return errorResponse(
      res,
      500,
      "insert_failed",
      "Could not insert the client"
    );
  }

  // Generate client_secret
  const clientId = insertClientResponse.data.insert_team_one.apps[0].id;
  const clientSecret = "secret_" + crypto.randomBytes(16).toString("hex");
  const hmac = crypto.createHmac("sha256", GENERAL_SECRET_KEY!);
  hmac.update(`${clientId}.${clientSecret}`);

  const hmacSecret = hmac.digest("hex");

  console.log(clientSecret); // DEBUG
  console.log(hmacSecret); // DEBUG

  const insertSecretResponse = await client.mutate({
    mutation: insertSecretQuery,
    variables: {
      id: clientId,
      client_secret: clientSecret,
    },
  });

  if (insertSecretResponse?.data?.update_app_by_pk) {
    const app = insertSecretResponse.data.update_app_by_pk;
    res.status(201).json({
      application_type: (req.body.application_type = "web"),
      client_id: app.id,
      client_id_issued_at: app.created_at,
      client_name: app.name,
      client_secret: clientSecret,
      client_secret_expires_at: 0,
      grant_types: (req.body.grant_types = "authorization_code"),
      logo_uri: app.logo_url,
      redirect_uris: app.redirect_uris,
      response_types: (req.body.response_types = "code"),
    });
  } else {
    return errorResponse(
      res,
      500,
      "insert_failed",
      "Could not insert the client"
    );
  }
}
