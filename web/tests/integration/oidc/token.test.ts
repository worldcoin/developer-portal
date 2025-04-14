import handleOIDCToken from "@/pages/api/v1/oidc/token";
import { createHash } from "crypto";
import * as jose from "jose";
import { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import { publicJwk } from "tests/api/__mocks__/jwk";
import { integrationDBClean, integrationDBExecuteQuery } from "../setup";
import { setClientSecret, testGetSignInApp } from "../test-utils";

jest.mock("legacy/backend/kms", () =>
  require("tests/api/__mocks__/kms.mock.ts"),
);

const pkceChallenge = (code_verifier: string) => {
  return createHash("sha256")
    .update(code_verifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

beforeEach(async () => await integrationDBClean());

describe("/api/v1/oidc/token", () => {
  test("can exchange one-time auth code", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // Insert a valid auth code
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        "http://localhost:3000/login",
      ],
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
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
      [app_id, "83a313c5939399ba017d2381"],
    );
    expect(result.rowCount).toEqual(0);

    // Make sure the proper error response is now sent
    const { req: req2, res: res2 } = createMocks<
      NextApiRequest,
      NextApiResponse
    >({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
      },
    });
    await handleOIDCToken(req2, res2);
    expect(res2._getStatusCode()).toBe(400);
    expect(res2._getJSONData()).toEqual(
      expect.objectContaining({
        detail: "Invalid authorization code.",
        code: "invalid_grant",
      }),
    );
  });

  test("access_token is valid", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // Insert a valid auth code
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, verification_level, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        "orb",
        "http://localhost:3000/login",
      ],
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
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
      },
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
        "https://id.worldcoin.org/beta": expect.objectContaining({
          likely_human: "strong",
          credential_type: "orb",
        }),
        "https://id.worldcoin.org/v1": {
          verification_level: "orb",
        },
      }),
    );
  });

  test("access_token is valid with UTF-8 charset", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // Insert a valid auth code
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, verification_level, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        "orb",
        "http://localhost:3000/login",
      ],
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
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
      },
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
        "https://id.worldcoin.org/beta": expect.objectContaining({
          likely_human: "strong",
          credential_type: "orb",
        }),
        "https://id.worldcoin.org/v1": {
          verification_level: "orb",
        },
      }),
    );
  });

  test("successfully validates PKCE", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // Insert a valid auth code with PKCE
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, code_challenge, code_challenge_method, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        pkceChallenge("my_code_challenge"),
        "S256",
        "http://localhost:3000/login",
      ],
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        code_verifier: "my_code_challenge",
        redirect_uri: "http://localhost:3000/login",
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
      [app_id, "83a313c5939399ba017d2381"],
    );
    expect(result.rowCount).toEqual(0);
  });

  test("rejects invalid PKCE", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // Insert a valid auth code with PKCE
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, code_challenge, code_challenge_method, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        pkceChallenge("my_code_challenge"),
        "S256",
        "http://localhost:3000/login",
      ],
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        code_verifier: "invalid_code_challenge",
        redirect_uri: "http://localhost:3000/login",
      },
    });

    await handleOIDCToken(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      attribute: "code_verifier",
      code: "invalid_request",
      detail: "Invalid code verifier.",
      error: "invalid_request",
      error_description: "Invalid code verifier.",
    });

    // Verify that the auth code is deleted
    const result = await integrationDBExecuteQuery(
      "SELECT id FROM auth_code WHERE app_id = $1 AND auth_code = $2",
      [app_id, "83a313c5939399ba017d2381"],
    );
    expect(result.rowCount).toEqual(0);
  });

  test("prevent PKCE downgrade", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // Insert a valid auth code with PKCE
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, code_challenge, code_challenge_method, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        pkceChallenge("my_code_challenge"),
        "S256",
        "http://localhost:3000/login",
      ],
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
      },
    });

    await handleOIDCToken(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      attribute: "code_verifier",
      code: "invalid_request",
      detail: "Missing code verifier.",
      error: "invalid_request",
      error_description: "Missing code verifier.",
    });

    // Verify that the auth code is deleted
    const result = await integrationDBExecuteQuery(
      "SELECT id FROM auth_code WHERE app_id = $1 AND auth_code = $2",
      [app_id, "83a313c5939399ba017d2381"],
    );
    expect(result.rowCount).toEqual(0);
  });

  test("error when PKCE not expected", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // Insert a valid auth code with PKCE
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        "http://localhost:3000/login",
      ],
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        code_verifier: "my_code_challenge",
        redirect_uri: "http://localhost:3000/login",
      },
    });

    await handleOIDCToken(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      code: "invalid_request",
      error: "invalid_request",
      attribute: "code_verifier",
      detail: "Code verifier was not expected.",
      error_description: "Code verifier was not expected.",
    });

    // Verify that the auth code is deleted
    const result = await integrationDBExecuteQuery(
      "SELECT id FROM auth_code WHERE app_id = $1 AND auth_code = $2",
      [app_id, "83a313c5939399ba017d2381"],
    );
    expect(result.rowCount).toEqual(0);
  });

  test("properly sets CORS headers", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // Insert a valid auth code with PKCE
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, code_challenge, code_challenge_method, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        pkceChallenge("my_code_challenge"),
        "S256",
        "http://localhost:3000/login",
      ],
    );

    const { req: notPKCEReq, res: NotPKCERes } = createMocks<
      NextApiRequest,
      NextApiResponse
    >({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        client_secret,
        client_id: app_id,
        code: "83a313c5939399ba017d2381",
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
      },
    });

    await handleOIDCToken(notPKCEReq, NotPKCERes);

    expect(
      NotPKCERes._getHeaders()?.["access-control-allow-origin"],
    ).toBeUndefined();

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        code_verifier: "my_code_challenge",
        redirect_uri: "http://localhost:3000/login",
      },
    });

    await handleOIDCToken(req, res);

    expect(res._getHeaders()).toEqual(
      expect.objectContaining({
        "access-control-allow-origin": "*",
      }),
    );
  });

  test("successfully validates single redirect_uri", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // Insert a valid auth code
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        "http://localhost:3000/login",
      ],
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
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
      [app_id, "83a313c5939399ba017d2381"],
    );
    expect(result.rowCount).toEqual(0);
  });

  test("allows no redirect_uri when only one set", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // Insert a valid auth code
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        "http://localhost:3000/login",
      ],
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
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
      [app_id, "83a313c5939399ba017d2381"],
    );
    expect(result.rowCount).toEqual(0);
  });

  test("blocks no redirect_uri when multiple set", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // insert second redirect_uri
    await integrationDBExecuteQuery(
      "INSERT INTO redirect (action_id, redirect_uri) VALUES ((SELECT id FROM action WHERE app_id = $1 AND action = '') , $2)",
      [app_id, "http://localhost:3000/login2"],
    );

    // Insert a valid auth code
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        "http://localhost:3000/login",
      ],
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
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

    expect(res._getStatusCode()).toBe(400);

    const { code, detail, attribute } = res._getJSONData();
    expect(code).toEqual("invalid_request");
    expect(detail).toEqual("Missing redirect URI.");
    expect(attribute).toEqual("redirect_uri");
  });

  test("blocks wrong redirect_uri when multiple set", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // insert second redirect_uri
    await integrationDBExecuteQuery(
      "INSERT INTO redirect (action_id, redirect_uri) VALUES ((SELECT id FROM action WHERE app_id = $1 AND action = '') , $2)",
      [app_id, "http://localhost:3000/login2"],
    );

    // Insert a valid auth code
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        "http://localhost:3000/login",
      ],
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login2",
      },
    });

    await handleOIDCToken(req, res);

    expect(res._getStatusCode()).toBe(400);

    const { code, detail, attribute } = res._getJSONData();
    expect(code).toEqual("invalid_request");
    expect(detail).toEqual("Invalid redirect URI.");
    expect(attribute).toEqual("redirect_uri");
  });

  test("accepts correct redirect_uri when multiple set", async () => {
    const app_id = await testGetSignInApp();
    const { client_secret } = await setClientSecret(app_id);

    // insert second redirect_uri
    await integrationDBExecuteQuery(
      "INSERT INTO redirect (action_id, redirect_uri) VALUES ((SELECT id FROM action WHERE app_id = $1 AND action = '') , $2)",
      [app_id, "http://localhost:3000/login2"],
    );

    // Insert a valid auth code
    await integrationDBExecuteQuery(
      "INSERT INTO auth_code (app_id, auth_code, expires_at, nullifier_hash, scope, redirect_uri) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        app_id,
        "83a313c5939399ba017d2381",
        "2030-09-01T00:00:00.000Z",
        "0x000000000000000111111111111",
        '["openid", "email"]',
        "http://localhost:3000/login",
      ],
    );

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: {
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
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
      [app_id, "83a313c5939399ba017d2381"],
    );
    expect(result.rowCount).toEqual(0);
  });
});
