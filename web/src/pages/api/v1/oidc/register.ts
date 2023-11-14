import { gql } from "@apollo/client";
import { errorNotAllowed } from "src/backend/errors";
import { getAPIServiceClient } from "src/backend/graphql";
import { NextApiRequest, NextApiResponse } from "next";
import { generateHashedSecret } from "src/backend/utils";
import { logger } from "src/lib/logger";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";
import { validateUrl } from "src/lib/utils";
import rateLimit from "@/lib/rate-limit";
import { getClientIp } from "request-ip";

const insertClientQuery = gql`
  mutation InsertClient($name: String = "", $team_name: String = "") {
    insert_team_one(
      object: { apps: { data: { name: $name } }, name: $team_name }
    ) {
      apps {
        id
      }
      id
    }
  }
`;

const updateSigninActionQuery = gql`
  mutation UpdateSigninAction(
    $app_id: String = ""
    $client_secret: String = ""
    $privacy_policy_uri: String
    $terms_uri: String
  ) {
    update_action(
      where: { app_id: { _eq: $app_id }, action: { _eq: "" } }
      _set: {
        client_secret: $client_secret
        privacy_policy_uri: $privacy_policy_uri
        terms_uri: $terms_uri
      }
    ) {
      returning {
        id
        app {
          id
          name
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

const schema = yup.object({
  client_name: yup.string().strict(),
  application_type: yup.string().default("web"),
  grant_types: yup.string().default("authorization_code"),
  response_types: yup.string().default("code"),
  redirect_uris: yup
    .array()
    .of(yup.string().strict().required())
    .required("This attribute is required."),
  privacy_policy_uri: yup
    .string()
    .strict()
    .test("is-url", "Must be a valid URL", (value) => {
      return value != null ? validateUrl(value) : true;
    }),
  terms_uri: yup
    .string()
    .strict()
    .test("is-url", "Must be a valid URL", (value) => {
      return value != null ? validateUrl(value) : true;
    }),
});

const TOTAL_REQUESTS_PER_TTL_PERIOD = 35;
const SUCCESS_REQUESTS_PER_TTL_PERIOD = 2;

const totalRequestsRateLimiter = rateLimit({
  ttl: 60 * 60 * 1000, // 60 minutes
  maxItems: 1000,
});

const successRequestsRateLimiter = rateLimit({
  ttl: 60 * 60 * 1000, // 60 minutes
  maxItems: 1000,
});

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
  // ANCHOR: apply total requests rate limit
  try {
    const userIp = getClientIp(req);
    if (!userIp) {
      throw Error("Cannot determine ip address of user");
    }
    await totalRequestsRateLimiter.check(
      res,
      TOTAL_REQUESTS_PER_TTL_PERIOD,
      userIp
    );
  } catch (error) {
    logger.error("Failed to pass total requests rate limit", { error });
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  // ANCHOR: Parse redirect_uris into array and validate
  for (const redirect of parsedParams.redirect_uris) {
    try {
      const url = new URL(redirect ?? "");
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

  // ANCHOR: apply success requests rate limit
  try {
    const userIp = getClientIp(req);
    if (!userIp) {
      throw Error("Cannot determine ip address of user");
    }
    await successRequestsRateLimiter.check(
      res,
      SUCCESS_REQUESTS_PER_TTL_PERIOD,
      userIp
    );
  } catch (error) {
    logger.error("Failed to pass success requests rate limit", { error });
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  // Insert valid client into database
  const client = await getAPIServiceClient();

  const insertClientResponse = await client.mutate({
    mutation: insertClientQuery,
    variables: {
      name: parsedParams.client_name,
      team_name: parsedParams.client_name,
    },
  });

  if (!insertClientResponse?.data?.insert_team_one?.apps?.length) {
    throw Error("Could not insert the client");
  }

  // Generate client_secret
  const app_id = insertClientResponse.data.insert_team_one.apps[0].id;
  const { secret: client_secret, hashed_secret } = generateHashedSecret(app_id);

  const updateSigninActionResponse = await client.mutate({
    mutation: updateSigninActionQuery,
    variables: {
      app_id,
      client_secret: hashed_secret,
      privacy_policy_uri: parsedParams.privacy_policy_uri,
      terms_uri: parsedParams.terms_uri,
    },
  });

  const updatedAction =
    updateSigninActionResponse?.data?.update_action?.returning[0];

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
      objects: parsedParams.redirect_uris.map((redirect) => ({
        action_id: updatedAction.id,
        redirect_uri: redirect,
      })),
    },
  });

  if (
    !insertRedirectsResponse?.data?.insert_redirect?.returning?.length ||
    insertRedirectsResponse?.data?.insert_redirect?.affected_rows !==
      parsedParams.redirect_uris.length
  ) {
    // We let the response continue because the app and action were created, we just flag to the user that the redirects were not inserted
    logger.error("Could not insert the redirects", { req });
  }

  const { application_type, grant_types, response_types } = parsedParams;

  if (updateSigninActionResponse?.data?.update_action?.returning?.length) {
    const app = updateSigninActionResponse.data.update_action.returning[0].app;
    res.status(201).json({
      application_type,
      client_id: app.id,
      client_id_issued_at: app.created_at,
      client_name: app.name,
      client_secret,
      client_secret_expires_at: 0,
      grant_types,

      redirect_uris:
        insertRedirectsResponse.data?.insert_redirect.returning.map(
          (redirect) => redirect.redirect_uri
        ),

      ...(insertRedirectsResponse?.data?.insert_redirect?.affected_rows !==
      parsedParams.redirect_uris.length
        ? { insertion_error: "Redirect URIs not recorded." }
        : {}),

      response_types,
    });
  } else {
    logger.error("Could not insert the client", { req });
    throw Error("Could not insert the client");
  }
}
