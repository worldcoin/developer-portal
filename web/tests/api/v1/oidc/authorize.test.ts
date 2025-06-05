import { OIDCErrorCodes, OIDCScopes } from "@/api/helpers/oidc";
import { POST } from "@/api/v1/oidc/authorize";
import { OIDCResponseType } from "@/lib/types";
import { createPublicKey } from "crypto";
import dayjs from "dayjs";
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";
import { publicJwk } from "../../__mocks__/jwk";
import { semaphoreProofParamsMock } from "../../__mocks__/proof.mock";

// Mock the external dependencies
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(),
}));

jest.mock("@/api/helpers/kms", () =>
  require("tests/api/__mocks__/kms.mock.ts"),
);

jest.mock("@/api/helpers/jwks", () =>
  require("tests/api/__mocks__/jwks.mock.ts"),
);

// Mock the GraphQL SDKs
const FetchOIDCApp = jest.fn();
const Nullifier = jest.fn();
const UpsertNullifier = jest.fn();
const InsertAuthCode = jest.fn();

jest.mock("@/api/helpers/oidc/graphql/fetch-oidc-app.generated", () => ({
  getSdk: () => ({
    FetchOIDCApp,
  }),
}));

jest.mock("@/api/v1/oidc/authorize/graphql/fetch-nullifier.generated", () => ({
  getSdk: () => ({
    Nullifier,
  }),
}));

jest.mock("@/api/v1/oidc/authorize/graphql/upsert-nullifier.generated", () => ({
  getSdk: () => ({
    UpsertNullifier,
  }),
}));

jest.mock("@/api/helpers/oidc/graphql/insert-auth-code.generated", () => ({
  getSdk: () => ({
    InsertAuthCode,
  }),
}));

// Mock the verifyProof function
jest.mock("@/api/helpers/verify", () => ({
  verifyProof: jest.fn().mockResolvedValue({ error: null }),
}));

beforeEach(async () => {
  await global.RedisClient?.flushall();

  // Mock OIDC app fetch
  FetchOIDCApp.mockResolvedValue({
    app: [
      {
        id: "app_112233445566778",
        is_staging: false,
        actions: [
          {
            id: "action_staging_112233445566778",
            action: "",
            status: "active",
            external_nullifier:
              "0x1c75ff6366690115808bd58e4c6e3342068088703dffa0a0ee07f55892bb10bd",
            redirects: [
              {
                redirect_uri: "https://example.com/cb",
              },
            ],
          },
        ],
      },
    ],
  });

  // Mock nullifier operations
  Nullifier.mockResolvedValue({ nullifier: [] });
  UpsertNullifier.mockResolvedValue({
    insert_nullifier_one: { nullifier_hash: "0x123", id: "nil_123" },
  });

  // Mock auth code insertion
  InsertAuthCode.mockImplementation((args) => ({
    insert_auth_code_one: { auth_code: args.auth_code },
  }));
});

const VALID_REQUEST: Record<string, string> = {
  ...semaphoreProofParamsMock,
  app_id: "app_1234",
  scope: OIDCScopes.OpenID,
  response_type: OIDCResponseType.Code,
  redirect_uri: "https://example.com/cb",
};

describe("/api/v1/oidc/authorize [request validation]", () => {
  test("validate required attributes", async () => {
    const required_attributes = [
      "proof",
      "nullifier_hash",
      "merkle_root",
      "verification_level",
      "app_id",
      "response_type",
      "redirect_uri",
    ];
    for (const attribute of required_attributes) {
      const body = { ...VALID_REQUEST, [attribute]: undefined };
      delete body[attribute];
      const req = new NextRequest(
        "http://localhost:3000/api/v1/oidc/authorize",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        code: "validation_error",
        attribute,
        detail: "This attribute is required.",
      });
    }
  });

  test("openid scope is always required for OIDC requests", async () => {
    const invalid_scopes = ["invalid", "profile%20email", undefined, ""];
    for (const scope of invalid_scopes) {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/oidc/authorize",
        {
          method: "POST",
          body: JSON.stringify({ ...VALID_REQUEST, scope }),
        },
      );

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        attribute: "scope",
        detail: "The openid scope is always required.",
      });
    }
  });

  test("invalid response_type throws an error", async () => {
    const invalid_response_types = [
      "invalid",
      "code%20invalid",
      "code invalid",
    ];
    for (const response_type of invalid_response_types) {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/oidc/authorize",
        {
          method: "POST",
          body: JSON.stringify({ ...VALID_REQUEST, response_type }),
        },
      );

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        attribute: "response_type",
        code: OIDCErrorCodes.UnsupportedResponseType,
      });
    }
  });

  test("validate redirect_uri", async () => {
    const invalid_redirect_uris = [
      "http://example.com/cb",
      "https://example.com/cb?query=string",
      "https://example.com",
      "https://evil.com",
    ];
    for (const redirect_uri of invalid_redirect_uris) {
      const req = new NextRequest(
        "http://localhost:3000/api/v1/oidc/authorize",
        {
          method: "POST",
          body: JSON.stringify({ ...VALID_REQUEST, redirect_uri }),
        },
      );

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        attribute: "redirect_uri",
        detail: "Invalid redirect URI.",
        code: OIDCErrorCodes.InvalidRedirectURI,
      });
    }
  });
});

describe("/api/v1/oidc/authorize [authorization code flow]", () => {
  test("returns an authorization code", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/oidc/authorize", {
      method: "POST",
      body: JSON.stringify({ ...VALID_REQUEST }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      code: expect.stringMatching(/^[a-f0-9]{16,30}$/),
    });
  });

  test("prevents replayed proofs", async () => {
    const req1 = new NextRequest(
      "http://localhost:3000/api/v1/oidc/authorize",
      {
        method: "POST",
        body: JSON.stringify({ ...VALID_REQUEST }),
      },
    );

    const req2 = new NextRequest(
      "http://localhost:3000/api/v1/oidc/authorize",
      {
        method: "POST",
        body: JSON.stringify({ ...VALID_REQUEST }),
      },
    );

    await POST(req1);
    const response = await POST(req2);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      code: "invalid_proof",
      attribute: "proof",
      detail: "This proof has already been used. Please try again",
    });
  });
});

describe("/api/v1/oidc/authorize [implicit flow]", () => {
  test("returns a valid token", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/oidc/authorize", {
      method: "POST",
      body: JSON.stringify({ ...VALID_REQUEST, response_type: "id_token" }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ id_token: expect.any(String) });

    const jwt = data.id_token;
    const publicKey = createPublicKey({ format: "jwk", key: publicJwk });
    const { protectedHeader, payload } = await jwtVerify(jwt, publicKey);

    expect(protectedHeader).toEqual({
      alg: "RS256",
      kid: "kid_my_test_key",
      typ: "JWT",
    });

    expect(payload).toEqual({
      iss: "https://id.worldcoin.org",
      sub: semaphoreProofParamsMock.nullifier_hash,
      jti: expect.any(String),
      iat: expect.any(Number),
      exp: expect.any(Number),
      aud: "app_112233445566778",
      scope: "openid",
      "https://id.worldcoin.org/beta": {
        likely_human: "strong",
        credential_type: "orb",
        warning:
          "DEPRECATED and will be removed soon. Use `https://id.worldcoin.org/v1` instead.",
      },
      "https://id.worldcoin.org/v1": {
        verification_level: "orb",
      },
      nonce: semaphoreProofParamsMock.signal,
    });

    // Validate timestamps
    const iatDiff = Math.abs(dayjs().diff(dayjs.unix(payload.iat!), "second"));
    const oneHourFromNow = new Date().getTime() + 60 * 60 * 1000;

    const expDiff = Math.abs(oneHourFromNow / 1000 - payload.exp!);
    expect(iatDiff).toBeLessThan(2); // 2 sec
    expect(expDiff).toBeLessThan(2); // 2 sec
    expect(payload.iat!.toString().length).toEqual(10); // timestamp in seconds has 10 digits
  });
});

describe("/api/v1/oidc/authorize [hybrid flow]", () => {
  test("returns a valid token and authorization code", async () => {
    const req = new NextRequest("http://localhost:3000/api/v1/oidc/authorize", {
      method: "POST",
      body: JSON.stringify({
        ...VALID_REQUEST,
        response_type: "code id_token",
      }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id_token: expect.any(String),
      code: expect.stringMatching(/^[a-f0-9]{16,30}$/),
    });

    console.log(data);

    const jwt = data.id_token;
    const publicKey = createPublicKey({ format: "jwk", key: publicJwk });
    const { protectedHeader, payload } = await jwtVerify(jwt, publicKey);

    expect(protectedHeader).toEqual({
      alg: "RS256",
      kid: "kid_my_test_key",
      typ: "JWT",
    });

    expect(payload).toEqual({
      iss: "https://id.worldcoin.org",
      sub: semaphoreProofParamsMock.nullifier_hash,
      jti: expect.any(String),
      iat: expect.any(Number),
      exp: expect.any(Number),
      aud: "app_112233445566778",
      scope: "openid",
      "https://id.worldcoin.org/beta": {
        likely_human: "strong",
        credential_type: "orb",
        warning:
          "DEPRECATED and will be removed soon. Use `https://id.worldcoin.org/v1` instead.",
      },
      "https://id.worldcoin.org/v1": {
        verification_level: "orb",
      },
      nonce: semaphoreProofParamsMock.signal,
    });
    console.log("payload", payload);

    // Validate timestamps
    const iatDiff = Math.abs(dayjs().diff(dayjs.unix(payload.iat!), "second"));
    const oneHourFromNow = new Date().getTime() + 60 * 60 * 1000;

    const expDiff = Math.abs(oneHourFromNow / 1000 - payload.exp!);
    expect(iatDiff).toBeLessThan(2); // 2 sec
    expect(expDiff).toBeLessThan(2); // 2 sec
    expect(payload.iat!.toString().length).toEqual(10); // timestamp in seconds has 10 digits
    console.log("end");
  });
});
