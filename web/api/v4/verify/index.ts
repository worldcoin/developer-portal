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
import {
  INTEGRITY_VERIFICATION_ERROR_CODE,
  verifyIntegrityBundle,
} from "./integrity-bundle";
import {
  findUnrecognizedIssuers,
  isIssuerAllowlistEnforced,
  UNRECOGNIZED_ISSUER_ERROR_CODE,
} from "./issuer-schema";
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
  props: { params: Promise<{ app_id: string }> },
) {
  const params = await props.params;
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

    const verifierEnvironment =
      parsedParams.environment === "sandbox"
        ? "staging"
        : parsedParams.environment;

    // World ID 4.0 proofs name their credential issuer. The on-chain Verifier
    // only checks that the issuer schema is registered, and registration is
    // permissionless, so a self-registered issuer would otherwise be reported to
    // the relying party as a verified credential.
    if (parsedParams.protocol_version === "4.0") {
      // Scoped to the verifier this request will actually hit: staging and
      // production registries assign ids independently.
      const issuerEnvironment =
        verifierEnvironment === "staging" ? "staging" : "production";

      const unrecognizedIssuers = findUnrecognizedIssuers(
        parsedParams.responses as Array<{ issuer_schema_id?: unknown }>,
        issuerEnvironment,
      );

      if (unrecognizedIssuers.length > 0) {
        const enforced = isIssuerAllowlistEnforced();

        logger.warn("Unrecognized credential issuer in v4 verify request", {
          rp_id: rpId,
          app_id: appId,
          environment: issuerEnvironment,
          enforced,
          issuer_schema_ids: unrecognizedIssuers.map(
            (issuer) => issuer.issuerSchemaId,
          ),
        });

        if (enforced) {
          return errorResponse({
            statusCode: 400,
            code: UNRECOGNIZED_ISSUER_ERROR_CODE,
            detail:
              "The credential issuer is not recognized by World ID. Only credentials issued by recognized issuers can be verified.",
            attribute: `responses[${unrecognizedIssuers[0]!.index}].issuer_schema_id`,
            req,
            app_id: appId,
          });
        }
      }
    }

    const requiresSelfieCheckIntegrity =
      parsedParams.protocol_version === "4.0" &&
      (parsedParams.responses as Array<{ issuer_schema_id?: unknown }>).some(
        (response) => Number(response.issuer_schema_id) === 11,
      );

    if (
      requiresSelfieCheckIntegrity &&
      (!parsedParams.integrity_bundle ||
        parsedParams.integrity_bundle.version !== 2)
    ) {
      return errorResponse({
        statusCode: 403,
        code: INTEGRITY_VERIFICATION_ERROR_CODE,
        detail:
          "Self Check 4.0 responses require an integrity bundle signed with version 2.",
        attribute: "integrity_bundle",
        req,
        app_id: appId,
      });
    }

    if (parsedParams.integrity_bundle) {
      const integrityResult = await verifyIntegrityBundle({
        environment: verifierEnvironment,
        integrityBundle: parsedParams.integrity_bundle,
        nonce: parsedParams.nonce!,
        protocolVersion: parsedParams.protocol_version as "3.0" | "4.0",
        responses: parsedParams.responses as
          | SessionProofRequest["responses"]
          | UniquenessProofResponseV3[]
          | UniquenessProofResponseV4[],
        rpId,
      });

      if (!integrityResult.success) {
        return errorResponse({
          statusCode: 403,
          code: INTEGRITY_VERIFICATION_ERROR_CODE,
          detail: "Integrity bundle verification failed.",
          attribute: "integrity_bundle",
          req,
          app_id: appId,
        });
      }
    }

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
    return await handleUniquenessProofVerification(
      client,
      rpId,
      appId,
      {
        action: parsedParams.action!,
        action_description: parsedParams.action_description,
        nonce: parsedParams.nonce,
        protocol_version: parsedParams.protocol_version as "3.0" | "4.0",
        responses: parsedParams.responses as
          | UniquenessProofResponseV3[]
          | UniquenessProofResponseV4[],
        environment: parsedParams.environment,
      },
      req,
    );
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
