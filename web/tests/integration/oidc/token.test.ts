import { createMocks } from "node-mocks-http";
import handleOIDCToken from "src/pages/api/v1/oidc/token";
import {
  integrationDBExecuteQuery,
  integrationDBSetup,
  integrationDBTearDown,
} from "../setup";
import { setClientSecret, testGetDefaultApp } from "../test-utils";
import * as jose from "jose";
import { privateJwk, publicJwk } from "tests/api/__mocks__/jwk";
import { SignCommand } from "@aws-sdk/client-kms";
import { createPrivateKey, createSign } from "crypto";

jest.mock("src/backend/kms", () => ({
  getKMSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockImplementation(async (signCommand: SignCommand) => {
      if (!signCommand.input.Message) {
        throw new Error("Improper call, no message to sign.");
      }
      const key = createPrivateKey({ format: "jwk", key: privateJwk });
      const sign = createSign("RSA-SHA256");
      sign.update(Buffer.from(signCommand.input.Message));
      return {
        Signature: new Uint8Array(sign.sign(key).buffer),
      };
    }),
  })),
  signJWTWithKMSKey: jest.requireActual("src/backend/kms").signJWTWithKMSKey,
}));

// TODO: Consider moving this to a generalized jest environment
beforeEach(integrationDBSetup);
beforeEach(integrationDBTearDown);

describe("/api/v1/oidc/token", () => {
  test("can exchange one-time auth code", async () => {
    const app_id = await testGetDefaultApp();
    const { client_secret } = await setClientSecret(app_id);

    // Insert a valid auth code
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope) VALUES ($1, $2, $3, $4, $5)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
      ]
    );

    const { req, res } = createMocks({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
      },
    });

    await handleOIDCToken(req, res);

    expect(res._getStatusCode()).toBe(200);

    const { access_token, id_token, token_type, expires_in, scope } =
      res._getJSONData();
    expect(access_token).toBeTruthy();
    expect(id_token).toEqual(access_token);
    expect(token_type).toEqual("Bearer");
    expect(expires_in).toEqual(3600);
    expect(scope).toEqual("openid email");

    // Verify that the auth code is deleted
    const result = await integrationDBExecuteQuery(
      "SELECT id FROM auth_code WHERE app_id = $1 AND auth_code = $2",
      [app_id, "83a313c5939399ba017d2381"]
    );
    expect(result.rowCount).toEqual(0);

    // Make sure the proper error response is now sent
    const { req: req2, res: res2 } = createMocks({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
      },
    });
    await handleOIDCToken(req2, res2);
    expect(res2._getStatusCode()).toBe(400);
    expect(res2._getJSONData()).toEqual(
      expect.objectContaining({
        detail: "Invalid authorization code.",
        code: "invalid_grant",
      })
    );
  });

  test("access_token is valid", async () => {
    const app_id = await testGetDefaultApp();
    const { client_secret } = await setClientSecret(app_id);

    // Insert a valid auth code
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, credential_type) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        "orb",
      ]
    );

    const { req, res } = createMocks({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
      },
    });

    await handleOIDCToken(req, res);

    expect(res._getStatusCode()).toBe(200);

    const { access_token } = res._getJSONData();

    const { payload } = await jose.jwtVerify(
      access_token,
      await jose.importJWK(publicJwk, "RS256"),
      {
        issuer: process.env.JWT_ISSUER,
      }
    );

    expect(payload).toEqual(
      expect.objectContaining({
        sub: "0x000000000000000111111111111",
        aud: app_id,
        iss: process.env.JWT_ISSUER,
        exp: expect.any(Number),
        iat: expect.any(Number),
        jti: expect.any(String),
        scope: "openid email",
        email: "0x000000000000000111111111111@id.worldcoin.org",
        "https://id.worldcoin.org/beta": {
          likely_human: "strong",
          credential_type: "orb",
        },
      })
    );
  });
});
