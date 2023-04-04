import { when } from "jest-when";
import * as jose from "jose";
import { createMocks } from "node-mocks-http";
import { getTokenFromCookie } from "src/backend/cookies";
import { generateInviteJWT, generateOIDCJWT } from "src/backend/jwts";
import { OIDCScopes } from "src/backend/oidc";
import { CredentialType } from "src/lib/types";
import handleLogin from "src/pages/api/login";
import { publicJwk } from "./__mocks__/jwk";

const requestReturnFn = jest.fn();
const mutateReturnFn = jest.fn();
const clientReturnFn = jest.fn();
const keyReturnFn = jest.fn();
const signReturnFn = jest.fn();

jest.mock(
  "src/backend/graphql",
  jest.fn(() => ({
    getAPIServiceClient: () => ({
      query: requestReturnFn,
      mutate: mutateReturnFn,
    }),
  }))
);

jest.mock(
  "src/backend/kms",
  jest.fn(() => ({
    getKMSClient: () => clientReturnFn,
    createKMSKey: () => keyReturnFn,
    signJWTWithKMSKey: () => signReturnFn,
  }))
);

const validPayload = async () => ({
  sign_in_with_world_id_token: await generateOIDCJWT({
    kid: "kid_my_test_key",
    kms_id: "kms_my_test_id",
    nonce: "superRandomString",
    nullifier_hash:
      "0x2a6f11552fe9073280e1dc38358aa6b23ec4c14ab56046d4d97695b21b166690",
    app_id: "app_developer_portal",
    credential_type: CredentialType.Orb,
    scope: [OIDCScopes.OpenID],
  }),
  invite_token: await generateInviteJWT("name@example.com"),
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

  when(clientReturnFn).calledWith(expect.anything()).mockResolvedValue(true);

  when(keyReturnFn)
    .calledWith(expect.anything())
    .mockResolvedValue({
      keyId: "da112a8b-023d-4eda-ae7d-33fde0a721b4",
      publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvzV3R48ve50etEd4BtryHzo1x1h1tC1poHkSXGzjXPIXmYvuLyZPCWfNzuH9YpXfuZRch1p3YrFRavSoQClb/kfAOou/nZXPyFdVlhzQzLp0EGB+/WEjA5Zj4J39EDdyToXmxsVNezzZJG66kfhz1VmBd18WGGAPDvw9PAdR2LpybKXl9VvwY5CFHazkadFy8Any+nKHpn3R3MxRHaeJV3EZDJfC+C46BCULkAS8EnZAtfdTJubIE71cNoOu/WmQupYsotk1XT3aN07ctvYuhyejiE+6bU3awre/kOumyjzb/7UWeIMvwxbFor3fEUPJa70xFfqPJUpFyj8NXlPE5wIDAQAB
-----END PUBLIC KEY-----`,
    });

  when(signReturnFn)
    .calledWith(expect.anything())
    .mockResolvedValue(
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Imp3a182Y2VjMzQyNzVhMjI0Y2EwM2MxZjVmNjAwYzM1YmQyZiJ9.eyJpc3MiOiJodHRwczovL2lkLndvcmxkY29pbi5vcmciLCJzdWIiOiIweDE2N2JkMTZlMDg1YjA3OGZiMTk2ZWUxNTZhMTFiYjc1ZWRhYTI4N2JiY2M3OTkzMDIwZjdmNTZiNTA2NWViMjkiLCJqdGkiOiJmNzM2MTBiMC00NjM1LTRhYTUtOTZhNS05OTE0NDE2ZjQ1YWEiLCJpYXQiOjE2ODA2MzI4MDAzNzksImV4cCI6MTY4MDYzNjQwMDM3OSwiYXVkIjoiYXBwXzUxMmEwZGY4Njg4Mzg3NmExOTBkOGIxYWE3OWU2YTI2Iiwic2NvcGUiOiIiLCJodHRwczovL2lkLndvcmxkY29pbi5vcmcvYmV0YSI6eyJsaWtlbHlfaHVtYW4iOiJzdHJvbmciLCJjcmVkZW50aWFsX3R5cGUiOiJvcmIifSwibm9uY2UiOiJlY2VjYTFlNzgyODA1ODcwMzU5ODYwODMyYzNjODUzZCJ9.EUgyWIn18feIGwZr45R_K7TTv2bmdf6sFec7WB44D0-a7Lczd_srdcARz3c3fBOsDDVPX-KLpjvSqr2pWDKn_Qquxnzf38c4id2wsauE6Lw5K-1roxTVSr6u5NReVP446dz0VZ5pOO_4rbN1h3pEpKuV79bo4L1MeQooh6S1WQT8_rl-elIu_O84X90AhDiyNGlH6Z0ri_rgsnps82yuOYIG1na_qO5WA1XX8wVP7SaGh_Ln8MbNRKDT19Jz2gsDlkNJVI2mU20O4vzHRwHkOap19bZEfB-nydyqRnj6d6Zi8aYM1-G_DTDG8X5sGNswHg4iQvAPLT3u3PBNEUE9TweyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Imp3a182Y2VjMzQyNzVhMjI0Y2EwM2MxZjVmNjAwYzM1YmQyZiJ9.eyJpc3MiOiJodHRwczovL2lkLndvcmxkY29pbi5vcmciLCJzdWIiOiIweDE2N2JkMTZlMDg1YjA3OGZiMTk2ZWUxNTZhMTFiYjc1ZWRhYTI4N2JiY2M3OTkzMDIwZjdmNTZiNTA2NWViMjkiLCJqdGkiOiJmNzM2MTBiMC00NjM1LTRhYTUtOTZhNS05OTE0NDE2ZjQ1YWEiLCJpYXQiOjE2ODA2MzI4MDAzNzksImV4cCI6MTY4MDYzNjQwMDM3OSwiYXVkIjoiYXBwXzUxMmEwZGY4Njg4Mzg3NmExOTBkOGIxYWE3OWU2YTI2Iiwic2NvcGUiOiIiLCJodHRwczovL2lkLndvcmxkY29pbi5vcmcvYmV0YSI6eyJsaWtlbHlfaHVtYW4iOiJzdHJvbmciLCJjcmVkZW50aWFsX3R5cGUiOiJvcmIifSwibm9uY2UiOiJlY2VjYTFlNzgyODA1ODcwMzU5ODYwODMyYzNjODUzZCJ9.EUgyWIn18feIGwZr45R_K7TTv2bmdf6sFec7WB44D0-a7Lczd_srdcARz3c3fBOsDDVPX-KLpjvSqr2pWDKn_Qquxnzf38c4id2wsauE6Lw5K-1roxTVSr6u5NReVP446dz0VZ5pOO_4rbN1h3pEpKuV79bo4L1MeQooh6S1WQT8_rl-elIu_O84X90AhDiyNGlH6Z0ri_rgsnps82yuOYIG1na_qO5WA1XX8wVP7SaGh_Ln8MbNRKDT19Jz2gsDlkNJVI2mU20O4vzHRwHkOap19bZEfB-nydyqRnj6d6Zi8aYM1-G_DTDG8X5sGNswHg4iQvAPLT3u3PBNEUE9Tw"
    );
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

    const token = getTokenFromCookie(req, res);
    expect(token).toBeTruthy();

    const { payload } = await jose.jwtVerify(
      token as string,
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
