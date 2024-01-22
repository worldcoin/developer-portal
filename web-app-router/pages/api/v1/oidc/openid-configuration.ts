import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed } from "@/legacy/backend/errors";
import { OIDC_BASE_URL } from "@/legacy/lib/constants";
import { JWT_ISSUER } from "@/legacy/backend/jwts";
import { OIDCScopes } from "@/legacy/backend/oidc";

/**
 * Returns an OpenID Connect discovery document, according to spec
 * https://openid.net/specs/openid-connect-discovery-1_0.html
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
    authorization_endpoint: `${OIDC_BASE_URL}/authorize`,
    grant_types_supported: ["authorization_code", "implicit"],
    service_documentation: "https://docs.worldcoin.org/id/sign-in",
    op_policy_uri: "https://developer.worldcoin.org/privacy-statement",
    op_tos_uri: "https://developer.worldcoin.org/tos",
    subject_types_supported: ["pairwise"], // subject is unique to each application, cannot be used across
    response_modes_supported: ["query", "fragment", "form_post"],
    response_types_supported: [
      "code", // Authorization code flow
      "id_token", // Implicit flow
      "id_token token", // Implicit flow
      "code id_token", // Hybrid flow
    ],
  });
}
