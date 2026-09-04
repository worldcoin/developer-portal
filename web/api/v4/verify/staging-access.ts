import { verifyApiKey } from "@/api/helpers/auth/verify-api-key";
import { errorResponse } from "@/api/helpers/errors";
import { NextRequest, NextResponse } from "next/server";

export const ENVIRONMENT_NOT_ALLOWED_ERROR_CODE = "environment_not_allowed";

export type StagingAccessResult =
  | { authorized: true }
  | { authorized: false; response: NextResponse };

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
 * Staging cannot simply be refused: every World ID 4.0 RP belongs to a
 * production app (`register_rp` rejects staging apps) and is duplicated onto the
 * staging registry precisely so its developer can test against the simulator.
 * It is instead a privileged mode — available only to a caller who proves it is
 * the app's developer by presenting one of the team's API keys, which an end
 * user submitting a proof never holds.
 */
export async function authorizeStagingVerification(params: {
  req: NextRequest;
  appId: string;
}): Promise<StagingAccessResult> {
  const { req, appId } = params;

  // An unauthenticated caller gets the rule spelled out rather than the generic
  // "API key is required": production integrations reach this branch by
  // forwarding a client-supplied `environment`, and that is what they must stop
  // doing. Callers that did present a key fall through to verifyApiKey's own
  // errors, which say which part of the key was wrong.
  if (!req.headers.get("authorization")) {
    return {
      authorized: false,
      response: errorResponse({
        statusCode: 403,
        code: ENVIRONMENT_NOT_ALLOWED_ERROR_CODE,
        detail:
          "Verifying against the staging environment requires an API key for this app. Omit `environment` (or set it to `production`) to verify production proofs.",
        attribute: "environment",
        req,
        app_id: appId,
      }),
    };
  }

  const apiKeyResult = await verifyApiKey({ req, appId });

  if (!apiKeyResult.success) {
    return { authorized: false, response: apiKeyResult.errorResponse };
  }

  return { authorized: true };
}
