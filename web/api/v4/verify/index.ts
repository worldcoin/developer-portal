import { errorRequiredAttribute, errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  resolveRpRegistration,
  RpRegistrationStatus,
} from "@/api/helpers/rp-utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import {
  schema,
  SessionProofRequest,
  UniquenessProofResponseV3,
  UniquenessProofResponseV4,
} from "./request-schema";
import { handleSessionProofVerification } from "./session-proof/handler";
import { handleUniquenessProofVerification } from "./uniqueness-proof/handler";

/**
 * POST /api/v4/verify/:id
 *
 * Verifies World ID 4.0 proofs. Supports both app_id and rp_id as the route parameter.
 * Only works for migrated apps (those with rp_registration).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { app_id: string } },
) {
  const routeId = params.app_id;

  if (!routeId) {
    return errorRequiredAttribute("app_id", req);
  }

  let body;
  try {
    body = await req.json();
  } catch (error) {
    logger.warn("Invalid JSON in request body", {
      error,
      app_id: routeId,
    });

    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: "Invalid JSON in request body",
      attribute: null,
      req,
      app_id: routeId,
    });
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
  });

  if (!isValid) {
    return handleError(req);
  }

  let client;
  try {
    client = await getAPIServiceGraphqlClient();
  } catch (error) {
    logger.error("Failed to initialize GraphQL client", {
      error: error instanceof Error ? error.message : String(error),
      app_id: routeId,
    });

    return errorResponse({
      statusCode: 500,
      code: "internal_error",
      detail: "Internal server error.",
      attribute: null,
      req,
      app_id: routeId,
    });
  }

  try {
    // Resolve app_id/rp_id to rp_registration
    const resolveResult = await resolveRpRegistration(client, routeId);

    if (!resolveResult.success) {
      if (resolveResult.error === "invalid_format") {
        return errorResponse({
          statusCode: 400,
          code: "invalid_request",
          detail:
            "Invalid ID format. Expected app_id (app_xxx) or rp_id (rp_xxx).",
          attribute: "app_id",
          req,
          app_id: routeId,
        });
      }
      // error === "not_found"
      return errorResponse({
        statusCode: 400,
        code: "app_not_migrated",
        detail:
          "This app has not been migrated to World ID 4.0. Please use the v2 verify endpoint.",
        attribute: null,
        req,
        app_id: routeId,
      });
    }

    const rpRegistration = resolveResult.registration;

    // Check if RP registration is active
    if (rpRegistration.status !== RpRegistrationStatus.Registered) {
      return errorResponse({
        statusCode: 400,
        code: "rp_not_active",
        detail: "RP registration is not active.",
        attribute: null,
        req,
        app_id: routeId,
      });
    }

    // Validate app status
    const app = rpRegistration.app;
    if (app.status !== "active" || app.is_archived || app.deleted_at) {
      return errorResponse({
        statusCode: 404,
        code: "not_found",
        detail: "App not found. App may be no longer active.",
        attribute: null,
        req,
        app_id: routeId,
      });
    }

    const rpId = rpRegistration.rp_id;
    const appId = rpRegistration.app_id;

    // Early return for session proofs - handle separately
    if (parsedParams.session_id) {
      return await handleSessionProofVerification(rpId, appId, {
        session_id: parsedParams.session_id,
        nonce: parsedParams.nonce!,
        protocol_version: parsedParams.protocol_version,
        responses: parsedParams.responses as SessionProofRequest["responses"],
        environment: parsedParams.environment,
      });
    }

    // Handle uniqueness proofs
    return await handleUniquenessProofVerification(client, rpId, appId, {
      action: parsedParams.action!,
      action_description: parsedParams.action_description,
      nonce: parsedParams.nonce,
      protocol_version: parsedParams.protocol_version as "3.0" | "4.0",
      responses: parsedParams.responses as
        | UniquenessProofResponseV3[]
        | UniquenessProofResponseV4[],
      environment: parsedParams.environment,
    });
  } catch (error) {
    logger.error("Unhandled error in v4/verify", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      app_id: routeId,
    });

    return errorResponse({
      statusCode: 500,
      code: "internal_error",
      detail: "Internal server error.",
      attribute: null,
      req,
      app_id: routeId,
    });
  }
}
