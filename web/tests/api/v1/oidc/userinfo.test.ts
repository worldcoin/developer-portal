import { generateOIDCJWT } from "@/api/helpers/jwts";
import { OIDCScopes } from "@/api/helpers/oidc";
import { VerificationLevel } from "@worldcoin/idkit-core";

import { POST } from "@/api/v1/oidc/userinfo";
import { NextRequest } from "next/server";

jest.mock("@/api/helpers/kms", () =>
  require("tests/api/__mocks__/kms.mock.ts"),
);

jest.mock("@/api/helpers/jwks", () =>
  require("tests/api/__mocks__/jwks.mock.ts"),
);

describe("/api/v1/oidc/userinfo", () => {
  test("invalid jwt", async () => {
    const jwt = await generateOIDCJWT({
      kid: "test-key",
      nonce: "1234",
      app_id: "app_1234",
      kms_id: "test-kms-id",
      nullifier_hash: "0x00000",
      verification_level: VerificationLevel.Orb,
      scope: [OIDCScopes.OpenID, OIDCScopes.Profile],
    });
    // Ensure we're actually generating a JWT
    expect(jwt).toMatch(/^[\w-]*\.[\w-]*\.[\w-]*$/);

    const req = new NextRequest("http://localhost:3000/api/v1/oidc/userinfo", {
      method: "POST",
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    });

    const response = await POST(req);

    expect(response.status).toBe(401);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
      attribute: "token",
      code: "invalid_token",
    });
  });
});
