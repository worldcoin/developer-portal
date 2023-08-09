import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed } from "../../../../backend/errors";
import { OIDC_BASE_URL } from "../../../../lib/constants";
import { JWT_ISSUER } from "../../../../backend/jwts";
import { OIDCScopes } from "../../../../backend/oidc";

/**
 * Returns an OpenID Connect discovery document, according to spec
 * @param req
 * @param res
 */
export default async function handleOidcConfig(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["GET", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  res.status(200).json({
    issuer: JWT_ISSUER,
    jwks_uri: `${OIDC_BASE_URL}/jwks.json`,
    token_endpoint: `${OIDC_BASE_URL}/token`,
    code_challenge_methods_supported: ["S256"],
    scopes_supported: Object.values(OIDCScopes),
    id_token_signing_alg_values_supported: ["RSA"],
    userinfo_endpoint: `${OIDC_BASE_URL}/userinfo`,
    registration_endpoint: `${OIDC_BASE_URL}/register`,
    authorization_endpoint: `${OIDC_BASE_URL}/authorize`,
    grant_types_supported: ["authorization_code", "implicit"],
    service_documentation: "https://docs.worldcoin.org/id/sign-in",
    subject_types_supported: ["pairwise"], // subject is unique to each application, cannot be used across
    response_types_supported: [
      "code", // Authorization code flow
      "id_token", // Implicit flow
      "id_token token", // Implicit flow
      "code id_token", // Hybrid flow
    ],
  });
}
