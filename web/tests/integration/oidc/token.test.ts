import { POST } from "@/api/v1/oidc/token";
import { createHash } from "crypto";
import * as jose from "jose";
import { NextRequest, NextResponse } from "next/server";
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

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.status).toBe(200);

    const data = await response.json();
    const { access_token, id_token, token_type, expires_in, scope } = data;
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
    const request2 = new NextRequest(
      "http://localhost:3000/api/v1/oidc/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: "83a313c5939399ba017d2381",
          client_id: app_id,
          client_secret,
          grant_type: "authorization_code",
          redirect_uri: "http://localhost:3000/login",
        }),
      },
    );

    const response2 = (await POST(request2)) as NextResponse;
    expect(response2.status).toBe(400);
    const errorData = await response2.json();
    expect(errorData).toEqual(
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

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.status).toBe(200);

    const { access_token } = await response.json();

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

  test("form-urlencoded with UTF-8 charset is accepted", async () => {
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

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.status).toBe(200);

    const { access_token } = await response.json();

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

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        code_verifier: "my_code_challenge",
        redirect_uri: "http://localhost:3000/login",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.status).toBe(200);

    const { access_token, id_token, token_type, expires_in, scope } =
      await response.json();
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

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        code_verifier: "invalid_code_challenge",
        redirect_uri: "http://localhost:3000/login",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.status).toBe(400);
    const errorData = await response.json();
    expect(errorData).toEqual({
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

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.status).toBe(400);
    const errorData = await response.json();
    expect(errorData).toEqual({
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

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        code_verifier: "my_code_challenge",
        redirect_uri: "http://localhost:3000/login",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.status).toBe(400);
    const errorData = await response.json();
    expect(errorData).toEqual({
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

    const notPKCERequest = new NextRequest(
      "http://localhost:3000/api/v1/oidc/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_secret,
          client_id: app_id,
          code: "83a313c5939399ba017d2381",
          grant_type: "authorization_code",
          redirect_uri: "http://localhost:3000/login",
        }),
      },
    );

    const notPKCEResponse = (await POST(notPKCERequest)) as NextResponse;
    expect(
      notPKCEResponse.headers.get("access-control-allow-origin"),
    ).toBeNull();

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        code_verifier: "my_code_challenge",
        redirect_uri: "http://localhost:3000/login",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.headers.get("access-control-allow-origin")).toEqual("*");
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

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.status).toBe(200);

    const { access_token, id_token, token_type, expires_in, scope } =
      await response.json();
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

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.status).toBe(200);

    const { access_token, id_token, token_type, expires_in, scope } =
      await response.json();
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

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.status).toBe(400);

    const { code, detail, attribute } = await response.json();
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

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login2",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.status).toBe(400);

    const { code, detail, attribute } = await response.json();
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

    const request = new NextRequest("http://localhost:3000/api/v1/oidc/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: "83a313c5939399ba017d2381",
        client_id: app_id,
        client_secret,
        grant_type: "authorization_code",
        redirect_uri: "http://localhost:3000/login",
      }),
    });

    const response = (await POST(request)) as NextResponse;
    expect(response.status).toBe(200);

    const { access_token, id_token, token_type, expires_in, scope } =
      await response.json();
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
