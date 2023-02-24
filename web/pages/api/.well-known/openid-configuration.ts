import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed } from "../../../api-helpers/errors";
import { OIDC_ISSUER_URI } from "../../../consts";

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
    return errorNotAllowed(req.method, res);
  }

  res.status(200).json({
    issuer: OIDC_ISSUER_URI,
    authorization_endpoint: `${OIDC_ISSUER_URI}/api/v1/oidc/authorize`,
    token_endpoint: `${OIDC_ISSUER_URI}/api/v1/oidc/token`,
    userinfo_endpoint: `${OIDC_ISSUER_URI}/api/v1/oidc/userinfo`,
    registration_endpoint: `${OIDC_ISSUER_URI}/api/v1/oidc/register`,
    jwks_uri: `${OIDC_ISSUER_URI}/api/v1/oidc/jwks`,
    scopes_supported: ["openid"],
    response_types_supported: [
      "code",
      "id_token",
      // "code id_token", // TODO: Add support later
      // "token id_token" // TODO: Must be added to support Dynamic Registration spec
    ],
    grant_types_supported: ["authorization_code", "implicit"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RSA"],
  });
}
