import { JWT_ISSUER } from "@/api/helpers/jwts";
import { OIDCScopes } from "@/api/helpers/oidc";
import { OIDC_BASE_URL } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

/**
 * Returns an OpenID Connect discovery document, according to spec
 * https://openid.net/specs/openid-connect-discovery-1_0.html
 * @param req
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    issuer: JWT_ISSUER,
    jwks_uri: `${OIDC_BASE_URL}/jwks.json`,
    token_endpoint: `${OIDC_BASE_URL}/token`,
    code_challenge_methods_supported: ["S256"],
    scopes_supported: Object.values(OIDCScopes),
    id_token_signing_alg_values_supported: ["RSA"],
    userinfo_endpoint: `${OIDC_BASE_URL}/userinfo`,
    authorization_endpoint: `${OIDC_BASE_URL}/authorize`,
    grant_types_supported: ["authorization_code", "implicit"],
    service_documentation: "https://docs.world.org/world-id",
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

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(null, { status: 204 });
}
