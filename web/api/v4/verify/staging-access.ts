import { errorResponse } from "@/api/helpers/errors";
import { verifyHashedSecret } from "@/api/helpers/utils";
import { NextRequest, NextResponse } from "next/server";

export const ENVIRONMENT_NOT_ALLOWED_ERROR_CODE = "environment_not_allowed";

/**
 * How long a staging verification window stays open once a developer opens it.
 * Short enough that an app left in test mode heals on its own, long enough to
 * cover a working session.
 */
export const STAGING_VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Header carrying the token issued when the staging window was opened. */
export const STAGING_VERIFICATION_TOKEN_HEADER = "x-staging-verification-token";

export type StagingAccessResult =
  | { authorized: true }
  | { authorized: false; response: NextResponse };

/**
 * Whether this RP is currently inside a developer-opened staging window.
 *
 * Anything other than a timestamp in the future — never opened, already
 * expired, or unparseable — means closed: the decision fails towards
 * production.
 */
export function isStagingVerificationOpen(
  stagingVerificationExpiresAt: unknown,
  now: number = Date.now(),
): boolean {
  if (typeof stagingVerificationExpiresAt !== "string") {
    return false;
  }

  const expiresAt = new Date(stagingVerificationExpiresAt).getTime();

  // NaN from an unparseable timestamp fails every comparison, which is the
  // direction we want.
  return expiresAt > now;
}

/**
 * Decides whether this request may be verified against the staging environment.
 *
 * `environment` is a request-body field, and the integration this endpoint
 * documents forwards the wallet's result object verbatim, so its value is
 * controlled by whoever produced the proof — the person being verified. Staging
 * is not an equivalent identity tree: staging credentials are freely mintable
 * from the simulator, the staging verifier contract accepts them, and the
 * staging attestation service anchors the integrity bundle. An ungated staging
 * request therefore buys a fresh, distinct nullifier against a production RP and
 * defeats the one-person-one-nullifier guarantee the endpoint exists to provide.
 *
 * Staging cannot simply be refused, because every World ID 4.0 RP belongs to a
 * production app (`register_rp` rejects staging apps) and is duplicated onto the
 * staging registry precisely so its developer can test against the simulator.
 * Two independent things must therefore hold, and neither of them is the
 * client's word:
 *
 * 1. the app's own team opened a time-boxed staging window out of band, and
 * 2. this request carries the one-time token that opening it issued.
 *
 * The window alone would leave the app's production endpoint accepting simulator
 * proofs from anyone for as long as it is open — the developer's test session
 * would be an open door for their real users. The token alone would be a
 * standing credential that a backend could end up attaching to production
 * traffic while forwarding its user's `environment`, which is the confused
 * deputy this endpoint started with. Together, a staging verification has to be
 * both currently sanctioned and individually authorized.
 */
export function authorizeStagingVerification(params: {
  req: NextRequest;
  appId: string;
  rpId: string;
  stagingVerificationExpiresAt: unknown;
  stagingVerificationTokenHash: unknown;
}): StagingAccessResult {
  const {
    req,
    appId,
    rpId,
    stagingVerificationExpiresAt,
    stagingVerificationTokenHash,
  } = params;

  const refuse = (detail: string): StagingAccessResult => ({
    authorized: false,
    response: errorResponse({
      statusCode: 403,
      code: ENVIRONMENT_NOT_ALLOWED_ERROR_CODE,
      detail,
      attribute: "environment",
      req,
      app_id: appId,
    }),
  });

  if (
    !isStagingVerificationOpen(stagingVerificationExpiresAt) ||
    typeof stagingVerificationTokenHash !== "string" ||
    !stagingVerificationTokenHash
  ) {
    return refuse(
      "Staging verification is not open for this app. Open a staging window with the set_world_id_staging_verification tool, or omit `environment` (or set it to `production`) to verify production proofs.",
    );
  }

  const token = req.headers.get(STAGING_VERIFICATION_TOKEN_HEADER);

  if (!token) {
    return refuse(
      "Staging verification requires the token issued when the staging window was opened, sent as the x-staging-verification-token header.",
    );
  }

  if (!verifyHashedSecret(rpId, token, stagingVerificationTokenHash)) {
    return refuse("Invalid staging verification token.");
  }

  return { authorized: true };
}
