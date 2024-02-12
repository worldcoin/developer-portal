import { VerificationLevel } from "@worldcoin/idkit-core";
import { createMocks } from "node-mocks-http";
import { generateOIDCJWT } from "@/legacy/backend/jwts";
import { OIDCScopes } from "@/legacy/backend/oidc";

import handleOIDCUserinfo from "@/pages/api/v1/oidc/userinfo";
import { NextApiRequest, NextApiResponse } from "next";

jest.mock("legacy/backend/kms", () =>
  require("tests/api/__mocks__/kms.mock.ts"),
);

jest.mock("legacy/backend/jwks", () =>
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

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        authorization: `Bearer ${jwt}`,
      },
    });

    await handleOIDCUserinfo(req, res);

    expect(res._getStatusCode()).toBe(401);
    const response = res._getJSONData();
    expect(response).toMatchObject({
      attribute: "token",
      code: "invalid_token",
    });
  });
});
