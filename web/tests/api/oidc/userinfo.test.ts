import { createMocks } from "node-mocks-http";
import { generateOIDCJWT } from "src/backend/jwts";
import { OIDCScopes } from "src/backend/oidc";
import { CredentialType } from "src/lib/types";
import handleOIDCUserinfo from "src/pages/api/v1/oidc/userinfo";

jest.mock("src/backend/kms", () => require("tests/api/__mocks__/kms.mock.ts"));

jest.mock("src/backend/jwks", () =>
  require("tests/api/__mocks__/jwks.mock.ts")
);

describe("/api/v1/oidc/userinfo", () => {
  test("invalid jwt", async () => {
    const jwt = await generateOIDCJWT({
      kid: "test-key",
      nonce: "1234",
      app_id: "app_1234",
      kms_id: "test-kms-id",
      nullifier_hash: "0x00000",
      credential_type: CredentialType.Orb,
      scope: [OIDCScopes.OpenID, OIDCScopes.Profile],
    });
    // Ensure we're actually generating a JWT
    expect(jwt).toMatch(/^[\w-]*\.[\w-]*\.[\w-]*$/);

    const { req, res } = createMocks({
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
