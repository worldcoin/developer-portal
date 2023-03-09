import { createMocks } from "node-mocks-http";
import * as jose from "jose";
import handleLogin from "src/pages/api/login";
import { generateJWK } from "src/backend/jwks";
import { generateOIDCJWT } from "src/backend/jwts";
import { CredentialType } from "src/lib/types";
import { OIDCScopes } from "src/backend/oidc";
import { privateJwk, publicJwk } from "./__mocks__/jwk";
import { when } from "jest-when";
import { MOCKED_GENERAL_SECRET_KEY } from "jest.setup";

const requestReturnFn = jest.fn();
const mutateReturnFn = jest.fn();

jest.mock(
  "src/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
      mutate: mutateReturnFn,
    }),
  }))
);

const validPayload = async () => ({
  sign_in_with_world_id_token: await generateOIDCJWT({
    app_id: "app_developer_portal",
    nonce: "superRandomString",
    nullifier_hash:
      "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
    private_jwk: privateJwk,
    kid: "kid_my_test_key",
    credential_type: CredentialType.Orb,
    scope: [OIDCScopes.OpenID],
  }),
});

const sampleExistingUserResponse = () => ({
  data: {
    user: [
      {
        id: "432c849b-6fed-49fa-b127-3bdd7739867e",
        world_id_nullifier:
          "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
        team_id: "team_1",
      },
    ],
  },
});

beforeEach(() => {
  // Reset mocks for each test, can be overridden by each test
  when(requestReturnFn)
    .calledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          kid: "kid_my_test_key",
        }),
      })
    )
    .mockResolvedValue({
      data: {
        jwks: [{ id: "kid_my_test_key", public_jwk: publicJwk }],
      },
    })
    .calledWith(expect.anything())
    .mockResolvedValue(sampleExistingUserResponse());

  when(mutateReturnFn)
    .calledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          key: "login_nonce_superRandomString",
        }),
      })
    )
    .mockResolvedValue({ data: { delete_cache: { affected_rows: 1 } } });
});

describe("/api/v1/login", () => {
  test("user can login", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...(await validPayload()) },
    });

    await handleLogin(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().new_user).toEqual(false);
    const token = res._getJSONData().token;
    expect(token).toBeTruthy();

    const { payload } = await jose.jwtVerify(
      token,
      Buffer.from(JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET || "").key),
      {
        issuer: "https://id.worldcoin.org",
      }
    );
    const decodedToken = payload as Record<string, any>;
    expect(
      decodedToken["https://hasura.io/jwt/claims"]["x-hasura-default-role"]
    ).toEqual("user");
    expect(
      decodedToken["https://hasura.io/jwt/claims"]["x-hasura-user-id"]
    ).toEqual("432c849b-6fed-49fa-b127-3bdd7739867e");
    expect(
      decodedToken["https://hasura.io/jwt/claims"]["x-hasura-team-id"]
    ).toEqual("team_1");
  });

  test("user can sign up if account does not exist", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { ...(await validPayload()) },
    });

    when(requestReturnFn)
      .calledWith(expect.anything())
      .mockResolvedValue({ data: { user: [] } });

    await handleLogin(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().new_user).toEqual(true);
    expect(res._getJSONData().token).toBeFalsy();

    const signup_token = res._getJSONData().signup_token;
    expect(signup_token).toBeTruthy();

    const { payload } = await jose.jwtVerify(
      signup_token,
      Buffer.from(MOCKED_GENERAL_SECRET_KEY),
      {
        issuer: "https://id.worldcoin.org",
      }
    );

    expect(payload.sub).toEqual(
      "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690"
    );
  });
});

describe("/api/v1/login [error cases]", () => {
  test("user cannot login with incorrectly signed JWT", async () => {
    const { privateJwk: newKey } = await generateJWK("RS256");
    const oidcJWT = await generateOIDCJWT({
      app_id: "app_developer_portal",
      nonce: "superRandomString",
      nullifier_hash:
        "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
      private_jwk: newKey,
      kid: "kid_my_test_key",
      credential_type: CredentialType.Orb,
      scope: [OIDCScopes.OpenID],
    });

    const { req, res } = createMocks({
      method: "POST",
      body: { sign_in_with_world_id_token: oidcJWT },
    });

    await handleLogin(req, res);

    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({
      code: "unauthenticated",
      detail: "Invalid or expired token.",
      attribute: null,
    });
  });

  test("user cannot login with expired JWT", async () => {
    //  TODO
  });

  test("user cannot login if JWK is not found", async () => {
    //  TODO
  });

  test("user cannot login with expired JWK", async () => {
    //  TODO
  });
});
