import {
  OIDCErrorCodes,
  OIDCScopes,
  fetchOIDCAppQuery,
  insertAuthCodeQuery,
} from "@/legacy/backend/oidc";
import { OIDCResponseType } from "@/legacy/lib/types";
import handleOIDCAuthorize from "@/pages/api/v1/oidc/authorize";
import { createPublicKey } from "crypto";
import dayjs from "dayjs";
import fetchMock from "jest-fetch-mock";
import { when } from "jest-when";
import { jwtVerify } from "jose";
import { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import { publicJwk } from "../__mocks__/jwk";
import { semaphoreProofParamsMock } from "../__mocks__/proof.mock";
import { validSemaphoreProofMock } from "../__mocks__/sequencer.mock";

jest.mock("legacy/backend/kms", () =>
  require("tests/api/__mocks__/kms.mock.ts"),
);

jest.mock("legacy/backend/jwks", () =>
  require("tests/api/__mocks__/jwks.mock.ts"),
);

const fetchAppQueryResponse = () => ({
  data: {
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
  },
});

const requestReturnFn = jest.fn();
const mutateReturnFn = jest.fn();

jest.mock(
  "legacy/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
      mutate: mutateReturnFn,
    }),
  })),
);

beforeEach(async () => {
  await global.RedisClient?.flushall();

  when(requestReturnFn)
    .calledWith(
      expect.objectContaining({
        query: fetchOIDCAppQuery,
      }),
    )
    .mockResolvedValue(fetchAppQueryResponse());

  // Mock for nullifier insertion
  when(mutateReturnFn)
    .calledWith(
      expect.objectContaining({
        variables: {
          object: {
            nullifier_hash: expect.any(String),
            merkle_root: expect.any(String),
            verification_level: expect.any(String),
            action_id: expect.any(String),
          },
        },
      }),
    )
    .mockResolvedValue({
      data: {
        insert_nullifier_one: { nullifier_hash: "0x123", id: "nil_123" },
      },
    });

  // Mock for auth code insertion for one-time use
  when(mutateReturnFn)
    .calledWith(expect.objectContaining({ mutation: insertAuthCodeQuery }))
    .mockImplementation((args) => ({
      data: { insert_auth_code_one: { auth_code: args.variables.auth_code } },
    }));
});

beforeAll(() => {
  fetchMock.enableMocks();
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
      // Scope is always required, but is validated in a separate test
    ];
    for (const attribute of required_attributes) {
      const body = { ...VALID_REQUEST, [attribute]: undefined };
      delete body[attribute];
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body,
      });

      await handleOIDCAuthorize(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = res._getJSONData();
      expect(response).toMatchObject({
        code: "invalid",
        attribute,
        detail: "This attribute is required.",
      });
    }
  });

  test("openid scope is always required for OIDC requests", async () => {
    const invalid_scopes = ["invalid", "profile%20email", undefined, ""];
    for (const scope of invalid_scopes) {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: { ...VALID_REQUEST, scope },
      });

      await handleOIDCAuthorize(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = res._getJSONData();
      expect(response).toMatchObject({
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
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: { ...VALID_REQUEST, response_type },
      });

      await handleOIDCAuthorize(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = res._getJSONData();
      expect(response).toMatchObject({
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
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: { ...VALID_REQUEST, redirect_uri },
      });

      await handleOIDCAuthorize(req, res);

      expect(res._getStatusCode()).toBe(400);
      const response = res._getJSONData();
      expect(response).toMatchObject({
        attribute: "redirect_uri",
        detail: "Invalid redirect URI.",
        code: OIDCErrorCodes.InvalidRedirectURI,
      });
    }
  });
});

describe("/api/v1/oidc/authorize [authorization code flow]", () => {
  test("returns an authorization code", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: { ...VALID_REQUEST },
    });

    fetchMock
      .mockIf(/^https:\/\/[a-z-]+\.crypto\.worldcoin\.org/)
      .mockResponse(JSON.stringify(validSemaphoreProofMock));

    await handleOIDCAuthorize(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toEqual({
      code: expect.stringMatching(/^[a-f0-9]{16,30}$/),
    });
  });
  test("prevents replayed proofs", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: { ...VALID_REQUEST },
    });

    const { req: req2, res: res2 } = createMocks<
      NextApiRequest,
      NextApiResponse
    >({
      method: "POST",
      body: { ...VALID_REQUEST },
    });

    fetchMock
      .mockIf(/^https:\/\/[a-z-]+\.crypto\.worldcoin\.org/)
      .mockResponse(JSON.stringify(validSemaphoreProofMock));

    await handleOIDCAuthorize(req, res);
    await handleOIDCAuthorize(req2, res2);

    expect(res2._getStatusCode()).toBe(400);

    const response = res2._getJSONData();
    expect(response).toMatchObject({
      code: "invalid_proof",
      attribute: "proof",
      detail: "This proof has already been used. Please try again",
    });
  });
});

describe("/api/v1/oidc/authorize [implicit flow]", () => {
  test("returns a valid token", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: { ...VALID_REQUEST, response_type: "id_token" },
    });

    fetchMock
      .mockIf(/^https:\/\/[a-z-]+\.crypto\.worldcoin\.org/)
      .mockResponse(JSON.stringify(validSemaphoreProofMock));

    await handleOIDCAuthorize(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toEqual({ id_token: expect.any(String) });

    const jwt = response.id_token;
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
      sid: expect.any(String),
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
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: { ...VALID_REQUEST, response_type: "code id_token" },
    });

    fetchMock
      .mockIf(/^https:\/\/[a-z-]+\.crypto\.worldcoin\.org/)
      .mockResponse(JSON.stringify(validSemaphoreProofMock));

    await handleOIDCAuthorize(req, res);

    expect(res._getStatusCode()).toBe(200);
    const response = res._getJSONData();
    expect(response).toEqual({
      id_token: expect.any(String),
      code: expect.stringMatching(/^[a-f0-9]{16,30}$/),
    });

    const jwt = response.id_token;
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
      sid: expect.any(String),
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
