import { gql } from "@apollo/client";
import { errorOIDCResponse } from "src/backend/errors";
import { getAPIServiceClient } from "src/backend/graphql";
import { fetchActiveJWK } from "src/backend/jwks";
import { generateOIDCJWT } from "src/backend/jwts";
import { authenticateOIDCEndpoint } from "src/backend/oidc";
import { AuthCodeModel } from "src/lib/models";
import { NextApiRequest, NextApiResponse } from "next";
import { createHash, timingSafeEqual } from "crypto";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";
import { runCors } from "src/backend/cors";

const findAuthCodeQuery = gql`
  query FindAuthCode(
    $auth_code: String!
    $app_id: String!
    $now: timestamptz!
  ) {
    auth_code(
      where: {
        app_id: { _eq: $app_id }
        expires_at: { _gt: $now }
        auth_code: { _eq: $auth_code }
      }
    ) {
      nullifier_hash
      credential_type
      scope
      code_challenge
      code_challenge_method
    }
  }
`;

const deleteAuthCodeQuery = gql`
  mutation DeleteAuthCode(
    $auth_code: String!
    $app_id: String!
    $now: timestamptz!
  ) {
    delete_auth_code(
      where: {
        app_id: { _eq: $app_id }
        expires_at: { _gt: $now }
        auth_code: { _eq: $auth_code }
      }
    ) {
      affected_rows
    }
  }
`;

const schema = yup.object({
  grant_type: yup.string().default("authorization_code"),
  code: yup.string().strict().required("This attribute is required."),
});

export default async function handleOIDCToken(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "OPTIONS" || req.body.code_verifier) {
    await runCors(req, res);
  }

  if (!req.method || !["POST"].includes(req.method)) {
    return errorOIDCResponse(
      res,
      400,
      "invalid_request",
      "Method not allowed.",
      null,
      req
    );
  }

  if (req.headers["content-type"] !== "application/x-www-form-urlencoded") {
    return errorOIDCResponse(
      res,
      400,
      "invalid_request",
      "Invalid content type. Only application/x-www-form-urlencoded is supported.",
      null,
      req
    );
  }

  // ANCHOR: Authenticate the request
  let authToken = req.headers.authorization;

  if (!authToken) {
    // Attempt to get the credentials in the request body
    const { client_id, client_secret } = req.body;
    if (client_id && client_secret) {
      authToken = `Basic ${Buffer.from(
        `${client_id}:${client_secret}`
      ).toString("base64")}`;
    }
  }

  if (!authToken) {
    return errorOIDCResponse(
      res,
      401,
      "unauthorized_client",
      "Please provide your app authentication credentials.",
      null,
      req
    );
  }

  let app_id: string | null;
  app_id = await authenticateOIDCEndpoint(authToken);

  if (!app_id) {
    return errorOIDCResponse(
      res,
      401,
      "unauthorized_client",
      "Invalid authentication credentials",
      null,
      req
    );
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  const auth_code = parsedParams.code;

  const client = await getAPIServiceClient();
  const now = new Date().toISOString();
  const { data } = await client.query<{
    auth_code: Array<
      Pick<
        AuthCodeModel,
        | "nullifier_hash"
        | "credential_type"
        | "scope"
        | "code_challenge"
        | "code_challenge_method"
      >
    >;
  }>({
    query: findAuthCodeQuery,
    variables: {
      auth_code,
      app_id,
      now,
    },
  });

  const code = data?.auth_code[0];

  if (!code) {
    return errorOIDCResponse(
      res,
      400,
      "invalid_grant",
      "Invalid authorization code.",
      null,
      req
    );
  }

  if (code.code_challenge) {
    if (!req.body.code_verifier) {
      return errorOIDCResponse(
        res,
        400,
        "invalid_request",
        "Missing code verifier.",
        "code_verifier",
        req
      );
    }

    // We only support S256 method
    if (!verifyChallenge(code.code_challenge, req.body.code_verifier)) {
      await client.mutate({
        mutation: deleteAuthCodeQuery,
        variables: {
          auth_code,
          app_id,
          now,
        },
      });

      return errorOIDCResponse(
        res,
        400,
        "invalid_request",
        "Invalid code verifier.",
        "code_verifier",
        req
      );
    }
  } else {
    if (req.body.code_verifier) {
      return errorOIDCResponse(
        res,
        400,
        "invalid_request",
        "Code verifier was not expected.",
        "code_verifier",
        req
      );
    }
  }

  const jwk = await fetchActiveJWK();
  const token = await generateOIDCJWT({
    app_id,
    nullifier_hash: code.nullifier_hash,
    credential_type: code.credential_type,
    ...jwk,
    scope: code.scope,
  });

  await client.mutate({
    mutation: deleteAuthCodeQuery,
    variables: {
      auth_code,
      app_id,
      now,
    },
  });

  return res.status(200).json({
    access_token: token,
    token_type: "Bearer",
    expires_in: 3600,
    scope: code.scope.join(" "),
    id_token: token,
  });
}

const verifyChallenge = (challenge: string, verifier: string) => {
  const hashedVerifier = createHash("sha256")
    .update(verifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return timingSafeEqual(Buffer.from(challenge), Buffer.from(hashedVerifier));
};
