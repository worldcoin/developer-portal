import { generateHashedSecret } from "@/api/helpers/utils";
import {
  authorizeStagingVerification,
  STAGING_VERIFICATION_TOKEN_HEADER,
} from "@/api/v4/verify/staging-access";
import { NextRequest } from "next/server";

// #region Mocks
jest.mock("../../../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const appId = "app_e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1e1";
const rpId = "rp_0123456789abcdef";

const requestWithToken = (token?: string) =>
  new NextRequest(new URL(`/api/v4/verify/${appId}`, "http://localhost:3000"), {
    method: "POST",
    headers: token ? { [STAGING_VERIFICATION_TOKEN_HEADER]: token } : {},
  });

const openWindow = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

const authorize = (params: {
  token?: string;
  expiresAt?: string | null;
  tokenHash: string | null;
}) =>
  authorizeStagingVerification({
    req: requestWithToken(params.token),
    appId,
    rpId,
    stagingVerificationExpiresAt:
      params.expiresAt === undefined ? openWindow() : params.expiresAt,
    stagingVerificationTokenHash: params.tokenHash,
  });
// #endregion

/**
 * The handler-level suite mocks `verifyHashedSecret`, so these cases run the
 * gate against the real HMAC helper: a token issued the way the MCP tool issues
 * one must authorize, and near-miss tokens must not.
 */
// #region Real token verification
describe("authorizeStagingVerification [real HMAC]", () => {
  it("authorizes the token that was issued for this RP", () => {
    const { secret, hashed_secret } = generateHashedSecret(rpId);

    expect(authorize({ token: secret, tokenHash: hashed_secret })).toEqual({
      authorized: true,
    });
  });

  it("refuses a token issued for a different RP", () => {
    // Same secret bytes, but the HMAC is bound to another RP's identifier, so
    // one app's window cannot authorize staging on another app.
    const { secret } = generateHashedSecret(rpId);
    const { hashed_secret: otherRpHash } = generateHashedSecret(
      "rp_fedcba9876543210",
    );

    expect(
      authorize({ token: secret, tokenHash: otherRpHash }).authorized,
    ).toBe(false);
  });

  it("refuses a token from a superseded window", () => {
    const { secret: oldToken } = generateHashedSecret(rpId);
    const { hashed_secret: currentHash } = generateHashedSecret(rpId);

    expect(
      authorize({ token: oldToken, tokenHash: currentHash }).authorized,
    ).toBe(false);
  });

  it("refuses a truncated copy of a valid token", () => {
    const { secret, hashed_secret } = generateHashedSecret(rpId);

    expect(
      authorize({ token: secret.slice(0, -1), tokenHash: hashed_secret })
        .authorized,
    ).toBe(false);
  });

  it("refuses a valid token once the window has closed", () => {
    const { secret, hashed_secret } = generateHashedSecret(rpId);

    expect(
      authorize({
        token: secret,
        expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
        tokenHash: hashed_secret,
      }).authorized,
    ).toBe(false);
  });
});
// #endregion
