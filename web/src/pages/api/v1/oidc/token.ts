import { gql } from "@apollo/client";
import {
  errorNotAllowed,
  errorOIDCResponse,
  errorRequiredAttribute,
  errorUnauthenticated,
  errorValidation,
} from "src/backend/errors";
import { getAPIServiceClient } from "src/backend/graphql";
import { fetchActiveJWK } from "src/backend/jwks";
import { generateOIDCJWT } from "src/backend/jwts";
import { authenticateOIDCEndpoint } from "src/backend/oidc";
import { JWK_ALG_OIDC } from "src/lib/constants";
import { AuthCodeModel } from "src/lib/models";
import { NextApiRequest, NextApiResponse } from "next";

const verifyAuthCodeQuery = gql`
  query VerifyAuthCode(
    $auth_code: String!
    $app_id: String!
    $now: timestamptz!
  ) {
    auth_code(
      where: {
        auth_code: { _eq: $auth_code }
        app_id: { _eq: $app_id }
        expires_at: { _gt: $now }
      }
    ) {
      nullifier_hash
      credential_type
      scope
    }
  }
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["POST"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  if (req.headers["content-type"] !== "application/x-www-form-urlencoded") {
    return errorValidation(
      "invalid_content_type",
      "Invalid content type. Only application/x-www-form-urlencoded is supported.",
      null,
      res
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
    return errorUnauthenticated(
      "Please provide your app authentication credentials.",
      res
    );
  }

  let app_id: string | null;
  app_id = await authenticateOIDCEndpoint(authToken);

  if (!app_id) {
    // TODO: Wrap all OIDC errors as they need to include the standard `error` and `error_description` attributes. @igorosip0v
    return errorUnauthenticated("Invalid authentication credentials.", res);
  }

  if (req.body.grant_type !== "authorization_code") {
    return errorOIDCResponse(
      res,
      400,
      "invalid_grant_type",
      "Invalid grant type. Only authorization_code is supported.",
      null
    );
  }

  const auth_code = req.body.code as string;
  if (!auth_code) {
    return errorRequiredAttribute("code", res);
  }

  // FIXME: Verify the redirect_uri coming in the body

  const client = await getAPIServiceClient();
  const now = new Date().toISOString();
  const { data } = await client.query<{
    auth_code: Array<
      Pick<AuthCodeModel, "nullifier_hash" | "credential_type" | "scope">
    >;
  }>({
    query: verifyAuthCodeQuery,
    variables: {
      auth_code,
      app_id,
      now,
    },
  });

  if (data.auth_code.length === 0) {
    return errorOIDCResponse(
      res,
      400,
      "invalid_grant",
      "Invalid authorization code."
    );
  }

  const code = data.auth_code[0];
  const jwk = await fetchActiveJWK(JWK_ALG_OIDC);
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
