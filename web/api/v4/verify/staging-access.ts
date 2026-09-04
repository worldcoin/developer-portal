import { errorResponse } from "@/api/helpers/errors";
import { NextRequest, NextResponse } from "next/server";

export const ENVIRONMENT_NOT_ALLOWED_ERROR_CODE = "environment_not_allowed";

/**
 * How long a staging verification window stays open once a developer opens it.
 * Short enough that an app that was left in test mode heals on its own, long
 * enough to cover a working session.
 */
export const STAGING_VERIFICATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export type StagingAccessResult =
  | { authorized: true }
  | { authorized: false; response: NextResponse };

/**
 * Whether this RP is currently in a developer-opened staging window.
 *
 * `staging_verification_expires_at` is written only by `set_world_id_staging_verification`,
 * which authenticates the app's team. Anything else — never opened, already
 * expired, or unparseable — means closed: the decision fails towards production.
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
 * The environment is therefore not authorized by anything in the request — a
 * credential on the request would still be attached by a backend that forwards
 * its user's `environment` field, which is the same confused deputy. It is
 * authorized by server state the app's own team set out of band: a time-boxed
 * staging window on the RP registration. Staging cannot simply be refused,
 * because every World ID 4.0 RP belongs to a production app (`register_rp`
 * rejects staging apps) and is duplicated onto the staging registry precisely so
 * its developer can test against the simulator.
 */
export function authorizeStagingVerification(params: {
  req: NextRequest;
  appId: string;
  stagingVerificationExpiresAt: unknown;
}): StagingAccessResult {
  const { req, appId, stagingVerificationExpiresAt } = params;

  if (isStagingVerificationOpen(stagingVerificationExpiresAt)) {
    return { authorized: true };
  }

  return {
    authorized: false,
    response: errorResponse({
      statusCode: 403,
      code: ENVIRONMENT_NOT_ALLOWED_ERROR_CODE,
      detail:
        "Staging verification is not enabled for this app. Open a staging window with the set_world_id_staging_verification tool, or omit `environment` (or set it to `production`) to verify production proofs.",
      attribute: "environment",
      req,
      app_id: appId,
    }),
  };
}
