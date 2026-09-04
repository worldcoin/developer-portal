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

// Mock verifyProof (I/O boundary — hits the sequencer). Keep the real
// canonicalizeNullifierHash: it is a pure helper and the exact behavior under
// test, so mocking it out would hide the canonicalization the handler relies on.
const mockVerifyProof = jest.fn().mockResolvedValue({ error: null });
jest.mock("@/api/helpers/verify", () => {
  const actual = jest.requireActual("@/api/helpers/verify");
  return {
    verifyProof: (...args: unknown[]) => mockVerifyProof(...args),
    encodeNullifierForStorage: jest.fn().mockReturnValue("0x123"),
    canonicalizeNullifierHash: actual.canonicalizeNullifierHash,
  };
});

beforeEach(async () => {
  await global.RedisClient?.flushall();
  mockVerifyProof.mockResolvedValue({ error: null });

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
  test("rejects apps excluded from active OIDC lookup", async () => {
    FetchOIDCApp.mockResolvedValueOnce({ app: [] });

    const req = new NextRequest("http://localhost:3000/api/v1/oidc/authorize", {
      method: "POST",
      body: JSON.stringify({ ...VALID_REQUEST }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toMatchObject({
      code: "app_not_found",
      attribute: "app_id",
      detail: "App not found or not active.",
    });
    expect(mockVerifyProof).not.toHaveBeenCalled();
  });

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

  test("cleans up proof key on verification failure so proof can be retried", async () => {
    // First request: verification fails
    mockVerifyProof.mockResolvedValueOnce({
      error: {
        statusCode: 400,
        code: "invalid_proof",
        message: "Invalid merkle root",
        attribute: "merkle_root",
      },
    });

    const req1 = new NextRequest(
      "http://localhost:3000/api/v1/oidc/authorize",
      {
        method: "POST",
        body: JSON.stringify({ ...VALID_REQUEST }),
      },
    );

    const failResponse = await POST(req1);
    expect(failResponse.status).toBe(400);

    // Second request with same proof should succeed (proof key was cleaned up)
    const req2 = new NextRequest(
      "http://localhost:3000/api/v1/oidc/authorize",
      {
        method: "POST",
        body: JSON.stringify({ ...VALID_REQUEST }),
      },
    );

    const successResponse = await POST(req2);
    expect(successResponse.status).toBe(200);
  });

  test("cleans up proof key when verifyProof throws so proof can be retried", async () => {
    mockVerifyProof.mockRejectedValueOnce(new Error("Sequencer timeout"));

    const req1 = new NextRequest(
      "http://localhost:3000/api/v1/oidc/authorize",
      {
        method: "POST",
        body: JSON.stringify({ ...VALID_REQUEST }),
      },
    );

    const failResponse = await POST(req1);
    expect(failResponse.status).toBe(500);

    const req2 = new NextRequest(
      "http://localhost:3000/api/v1/oidc/authorize",
      {
        method: "POST",
        body: JSON.stringify({ ...VALID_REQUEST }),
      },
    );

    const successResponse = await POST(req2);
    expect(successResponse.status).toBe(200);
  });

  test("keeps proof key after post-verification failures to prevent replay", async () => {
    InsertAuthCode.mockRejectedValueOnce(new Error("GraphQL unavailable"));

    const req1 = new NextRequest(
      "http://localhost:3000/api/v1/oidc/authorize",
      {
        method: "POST",
        body: JSON.stringify({ ...VALID_REQUEST }),
      },
    );

    const failResponse = await POST(req1);
    expect(failResponse.status).toBe(500);

    const req2 = new NextRequest(
      "http://localhost:3000/api/v1/oidc/authorize",
      {
        method: "POST",
        body: JSON.stringify({ ...VALID_REQUEST }),
      },
    );

    const replayResponse = await POST(req2);
    const replayData = await replayResponse.json();

    expect(replayResponse.status).toBe(400);
    expect(replayData).toMatchObject({
      code: "invalid_proof",
      attribute: "proof",
      detail: "This proof has already been used. Please try again",
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

// Regression for HackerOne #3896406: verifyProof normalizes the nullifier_hash
// internally (case / prefix / leading-zero), but the raw request value used to
// flow into the lookup, the stored row and the id_token sub/email. One human
// could therefore re-encode a single nullifier into multiple stable OIDC
// subjects and sibling nullifier rows (RP-side Sybil). The handler now
// canonicalizes before every identity-forming use.
describe("/api/v1/oidc/authorize [nullifier canonicalization]", () => {
  // The mock is already canonical (0x + 64 lowercase hex), so canonicalizing
  // any re-encoding of it must collapse back to exactly this value.
  const canonical = semaphoreProofParamsMock.nullifier_hash;
  const reEncodings: Record<string, string> = {
    "uppercase hex": `0x${canonical.slice(2).toUpperCase()}`,
    "stripped leading zero": `0x${canonical.slice(2).replace(/^0+/, "")}`,
  };

  const authorizeWith = async (nullifier_hash: string) => {
    const req = new NextRequest("http://localhost:3000/api/v1/oidc/authorize", {
      method: "POST",
      body: JSON.stringify({
        ...VALID_REQUEST,
        response_type: "id_token",
        nullifier_hash,
      }),
    });
    return POST(req);
  };

  for (const [label, variant] of Object.entries(reEncodings)) {
    test(`issues the canonical sub for a re-encoded nullifier (${label})`, async () => {
      // Guard: the re-encoded input is genuinely byte-distinct from canonical,
      // so a passing assertion proves canonicalization, not a no-op.
      expect(variant).not.toBe(canonical);

      const response = await authorizeWith(variant);
      expect(response.status).toBe(200);

      const { id_token } = await response.json();
      const publicKey = createPublicKey({ format: "jwk", key: publicJwk });
      const { payload } = await jwtVerify(id_token, publicKey);

      expect(payload.sub).toBe(canonical);
      expect(payload.sub).not.toBe(variant);
    });
  }

  test("looks up and inserts the nullifier in canonical form", async () => {
    // Drop accumulated call history (this suite does not clearAllMocks) so the
    // assertions below reflect only the re-encoded request under test.
    Nullifier.mockClear();
    UpsertNullifier.mockClear();

    const response = await authorizeWith(reEncodings["uppercase hex"]);
    expect(response.status).toBe(200);

    expect(Nullifier).toHaveBeenCalledWith({ nullifier_hash: canonical });
    expect(UpsertNullifier).toHaveBeenCalledWith(
      expect.objectContaining({
        object: expect.objectContaining({ nullifier_hash: canonical }),
      }),
    );
  });

  test("does not create a sibling row when the canonical nullifier already exists", async () => {
    // This suite's beforeEach does not clearAllMocks, so drop accumulated call
    // history to make the "no insert" assertion specific to this request.
    Nullifier.mockClear();
    UpsertNullifier.mockClear();

    // A re-encoded nullifier of an already-registered human: the canonical
    // lookup finds the existing row, so no second row is inserted.
    Nullifier.mockResolvedValueOnce({ nullifier: [{ id: "nil_existing" }] });

    const response = await authorizeWith(reEncodings["stripped leading zero"]);
    expect(response.status).toBe(200);

    expect(Nullifier).toHaveBeenCalledWith({ nullifier_hash: canonical });
    expect(UpsertNullifier).not.toHaveBeenCalled();
  });
});
