import { parseRpId } from "@/api/helpers/rp-utils";
import { getSessionAnalyticsGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";
import { captureEvent } from "@/services/posthogClient";
import { NextResponse } from "next/server";
import { SessionProofRequest } from "../request-schema";
import { processSessionProof, SessionResult } from "./verify-util";
import { getSdk } from "./graphql/insert-session-verification-v4.generated";

// Session proof response types
type SessionProofSuccessResponse = {
  success: true;
  session_id: string;
  environment: "production" | "staging" | "sandbox";
  results: SessionResult[];
  message: string;
};

type SessionProofErrorResponse = {
  success: false;
  code: string;
  detail: string;
  results?: SessionResult[];
};

type SessionProofResponse =
  | SessionProofSuccessResponse
  | SessionProofErrorResponse;

/**
 * Handle session proof verification flow.
 * Session proofs use production verifier and don't create action records.
 */
export async function handleSessionProofVerification(
  rpId: string,
  appId: string,
  parsedParams: {
    session_id: string;
    nonce: string;
    protocol_version: string;
    responses: SessionProofRequest["responses"];
    environment?: "production" | "staging" | "sandbox";
  },
): Promise<NextResponse<SessionProofResponse>> {
  // Get verifier address based on requested environment (defaults to production).
  // Sandbox uses staging verifier but remains sandbox in the API response.
  const requestedEnvironment = parsedParams.environment ?? "production";
  const verificationEnvironment =
    requestedEnvironment === "sandbox" ? "staging" : requestedEnvironment;

  const verifierAddress =
    verificationEnvironment === "staging"
      ? process.env.VERIFIER_CONTRACT_ADDRESS_STAGING
      : process.env.VERIFIER_CONTRACT_ADDRESS;

  if (!verifierAddress) {
    return NextResponse.json<SessionProofErrorResponse>(
      {
        success: false,
        code: "configuration_error",
        detail: `Verifier contract address not configured for ${verificationEnvironment} environment.`,
      },
      { status: 400 },
    );
  }

  // Build session proof request and verify
  const numericRpId = parseRpId(rpId);
  const sessionProofRequest: SessionProofRequest = {
    session_id: parsedParams.session_id,
    nonce: parsedParams.nonce,
    protocol_version: "4.0",
    responses: parsedParams.responses,
  };

  const verificationResults = await processSessionProof(
    numericRpId,
    sessionProofRequest,
    verifierAddress,
  );

  // If no successful verifications, return 400 with all results
  const allFailed = verificationResults.every((r) => r.success === false);
  if (allFailed) {
    await captureEvent({
      event: "session_verify_v4_failed",
      distinctId: rpId,
      properties: {
        rp_id: rpId,
        app_id: appId,
        session_id: parsedParams.session_id,
        protocol_version: "4.0",
        results: verificationResults,
      },
    });

    logger.warn("All session proof verifications failed", {
      rp_id: rpId,
      app_id: appId,
      session_id: parsedParams.session_id,
      results: verificationResults,
    });

    return NextResponse.json<SessionProofErrorResponse>(
      {
        success: false,
        code: "all_verifications_failed",
        detail: "All proof verifications failed.",
        results: verificationResults,
      },
      { status: 400 },
    );
  }

  const sessionId = parsedParams.session_id;
  const successfulResults = verificationResults.filter(
    (result) => result.success,
  ).length;

  try {
    const client = await getSessionAnalyticsGraphqlClient();
    await getSdk(client).InsertSessionVerificationV4({
      object: {
        rp_id: rpId,
        environment: verificationEnvironment,
        session_id: sessionId,
        successful_results: successfulResults,
      },
    });
  } catch (error) {
    logger.error("Failed to record v4 session verification analytics", {
      error,
      rp_id: rpId,
      session_id: sessionId,
    });
  }

  await captureEvent({
    event: "session_verify_v4_success",
    distinctId: rpId,
    properties: {
      rp_id: rpId,
      app_id: appId,
      session_id: sessionId,
    },
  });

  return NextResponse.json<SessionProofSuccessResponse>(
    {
      success: true,
      session_id: sessionId,
      environment: requestedEnvironment,
      results: verificationResults,
      message: "Session proof verified successfully",
    },
    { status: 200 },
  );
}
