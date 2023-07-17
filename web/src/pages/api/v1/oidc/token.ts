import { gql } from "@apollo/client";
import { errorOIDCResponse } from "src/backend/errors";
import { getAPIServiceClient } from "src/backend/graphql";
import { fetchActiveJWK } from "src/backend/jwks";
import { generateOIDCJWT } from "src/backend/jwts";
import { authenticateOIDCEndpoint } from "src/backend/oidc";
import { AuthCodeModel } from "src/lib/models";
import { NextApiRequest, NextApiResponse } from "next";

const verifyAuthCodeQuery = gql`
  mutation VerifyAuthCode(
    $auth_code: String!
    $app_id: String!
    $now: timestamptz!
  ) {
    delete_auth_code(
      where: {
        auth_code: { _eq: $auth_code }
        app_id: { _eq: $app_id }
        expires_at: { _gt: $now }
      }
    ) {
      returning {
        nullifier_hash
        credential_type
        scope
      }
    }
  }
`;

export default async function handleOIDCToken(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["POST"].includes(req.method)) {
    return errorOIDCResponse(
      res,
      400,
      "invalid_request",
      "Method not allowed."
    );
  }

  if (req.headers["content-type"] !== "application/x-www-form-urlencoded") {
    return errorOIDCResponse(
      res,
      400,
      "invalid_request",
      "Invalid content type. Only application/x-www-form-urlencoded is supported."
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
      "Please provide your app authentication credentials."
    );
  }

  let app_id: string | null;
  app_id = await authenticateOIDCEndpoint(authToken);

  if (!app_id) {
    return errorOIDCResponse(
      res,
      401,
      "unauthorized_client",
      "Invalid authentication credentials"
    );
  }

  if (req.body.grant_type !== "authorization_code") {
    return errorOIDCResponse(
      res,
      400,
      "invalid_grant",
      "Invalid grant type. Only authorization_code is supported.",
      null
    );
  }

  const auth_code = req.body.code as string;
  if (!auth_code) {
    return errorOIDCResponse(
      res,
      400,
      "invalid_request",
      "Required parameter code is missing.",
      "code"
    );
  }

  const client = await getAPIServiceClient();
  const now = new Date().toISOString();
  const { data } = await client.mutate<{
    delete_auth_code: {
      returning: Array<
        Pick<AuthCodeModel, "nullifier_hash" | "credential_type" | "scope">
      >;
    };
  }>({
    mutation: verifyAuthCodeQuery,
    variables: {
      auth_code,
      app_id,
      now,
    },
  });

  const code = data?.delete_auth_code?.returning[0];

  if (!code) {
    return errorOIDCResponse(
      res,
      400,
      "invalid_grant",
      "Invalid authorization code."
    );
  }

  const jwk = await fetchActiveJWK();
  const token = await generateOIDCJWT({
    app_id,
    nullifier_hash: code.nullifier_hash,
    credential_type: code.credential_type,
    ...jwk,
    scope: code.scope,
  });

  return res.status(200).json({
    access_token: token,
    token_type: "Bearer",
    expires_in: 3600,
    scope: code.scope.join(" "),
    id_token: token,
  });
}
