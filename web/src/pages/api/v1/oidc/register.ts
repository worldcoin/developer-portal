import { gql } from "@apollo/client";
import { errorNotAllowed, errorRequiredAttribute } from "src/backend/errors";
import { getAPIServiceClient } from "src/backend/graphql";
import { NextApiRequest, NextApiResponse } from "next";
import { generateHashedSecret } from "src/backend/utils";

const insertClientQuery = gql`
  mutation InsertClient(
    $name: String = ""
    $logo_url: String = ""
    $team_name: String = ""
  ) {
    insert_team_one(
      object: {
        apps: { data: { name: $name, logo_url: $logo_url } }
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

const updateSecretQuery = gql`
  mutation UpdateSecret($app_id: String = "", $client_secret: String = "") {
    update_action(
      where: { app_id: { _eq: $app_id }, action: { _eq: "" } }
      _set: { client_secret: $client_secret }
    ) {
      returning {
        id
        app {
          id
          name
          logo_url
          created_at
        }
      }
    }
  }
`;

const insertRedirectsQuery = gql`
  mutation InsertRedirects($objects: [redirect_insert_input!]!) {
    insert_redirect(objects: $objects) {
      returning {
        id
        action_id
        redirect_uri
      }
      affected_rows
    }
  }
`;

/**
 * Returns an OpenID Connect discovery document, according to spec
 * NOTE: This endpoint is rate limited with WAF to prevent abuse
 * @param req
 * @param res
 */
export default async function handleRegister(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  if (!req.body["redirect_uris"]) {
    return errorRequiredAttribute("redirect_uris", res, req);
  }

  // ANCHOR: Parse redirect_uris into array and validate
  for (const redirect in req.body.redirects) {
    try {
      const url = new URL(redirect);
      if (url.protocol !== "https:") {
        return res.status(400).json({
          error: "invalid_redirect_uri",
          error_description: "All redirect_uris must use HTTPS",
        });
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
      logo_url: req.body.logo_uri, // TODO: Fetch images ourselves to prevent malicious behavior
      team_name: req.body.client_name,
    },
  });

  if (!insertClientResponse?.data?.insert_team_one?.apps?.length) {
    throw Error("Could not insert the client");
  }

  // Generate client_secret
  const app_id = insertClientResponse.data.insert_team_one.apps[0].id;
  const { secret: client_secret, hashed_secret } = generateHashedSecret(app_id);

  const updateSecretResponse = await client.mutate({
    mutation: updateSecretQuery,
    variables: {
      app_id,
      client_secret: hashed_secret,
    },
  });

  const updatedAction = updateSecretResponse?.data?.update_action?.returning[0];

  // Insert redirects
  const insertRedirectsResponse = await client.mutate<{
    insert_redirect: {
      returning: Array<{
        id: string;
        action_id: string;
        redirect_uri: string;
      }>;

      affected_rows: number;
    };
  }>({
    mutation: insertRedirectsQuery,

    variables: {
      objects: req.body.redirects.map((redirect: string) => ({
        action_id: updatedAction.id,
        redirect_uri: redirect,
      })),
    },
  });

  if (
    !insertRedirectsResponse?.data?.insert_redirect?.returning?.length ||
    insertRedirectsResponse?.data?.insert_redirect?.affected_rows !==
      req.body.redirects.length
  ) {
    // We let the response continue because the app and action were created, we just flag to the user that the redirects were not inserted
    console.error("Could not insert the redirects");
  }

  if (updateSecretResponse?.data?.update_action?.returning?.length) {
    const app = updateSecretResponse.data.update_action.returning[0].app;
    res.status(201).json({
      application_type: (req.body.application_type = "web"),
      client_id: app.id,
      client_id_issued_at: app.created_at,
      client_name: app.name,
      client_secret,
      client_secret_expires_at: 0,
      grant_types: (req.body.grant_types = "authorization_code"),
      logo_uri: app.logo_url,

      redirect_uris:
        insertRedirectsResponse.data?.insert_redirect.returning.map(
          (redirect) => redirect.redirect_uri
        ),

      ...(insertRedirectsResponse?.data?.insert_redirect?.affected_rows !==
      req.body.redirects.length
        ? { insertion_error: "Redirect URIs not recorded." }
        : {}),

      response_types: (req.body.response_types = "code"),
    });
  } else {
    throw Error("Could not insert the client");
  }
}
