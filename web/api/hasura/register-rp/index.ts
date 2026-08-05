import { getSdk as getCheckUserSdk } from "@/api/hasura/graphql/checkUserInApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  submitManagedRpRegistration,
  type ManagedRegistrationResult,
} from "@/api/helpers/rp-registration-flows";
import { resolveManagerAddress } from "@/api/helpers/rp-manager";
import {
  addressesEqual,
  generateRpIdString,
  getRpRegistryConfig,
  isZeroAddress,
  normalizeAddress,
  parseRpId,
  RpRegistrationStatus,
} from "@/api/helpers/rp-utils";
import { getRpFromContract } from "@/api/helpers/temporal-rpc";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { isAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getClaimRpSdk } from "./graphql/claim-rp-registration.generated";
import { getSdk as getAppInfoSdk } from "./graphql/get-app-info.generated";

const schema = yup
  .object({
    app_id: yup.string().strict().required(),
    mode: yup
      .string()
      .strict()
      .oneOf(["managed", "self_managed"])
      .default("managed"),
    signer_address: yup
      .string()
      .strict()
      .nullable()
      .transform((value) => (value ? normalizeAddress(value) : value))
      .when("mode", {
        is: "managed",
        then: (s) =>
          s
            .required("signer_address is required for managed mode")
            .test(
              "is-address",
              "Invalid signer key. Must be 40 hex characters (0x followed by 40 characters)",
              (value) => (value ? isAddress(value) : false),
            )
            .test(
              "not-zero",
              "Cannot use zero address as the signer",
              (value) => !value || !isZeroAddress(value),
            ),
      }),
  })
  .noUnknown();

const REGISTRATION_ERROR_HTTP_CODE: Record<
  Exclude<ManagedRegistrationResult, { ok: true }>["code"],
  string
> = {
  staging_not_supported: "staging_not_supported",
  config_error: "config_error",
  already_registered: "already_registered",
  rp_id_taken: "rp_id_taken",
  kms_error: "kms_error",
  submission_error: "submission_error",
  db_error: "db_error",
};

/**
 * POST handler for the register_rp Hasura action.
 *
 * Auth path: dashboard user with ADMIN/OWNER on the team. The actual KMS +
 * on-chain + DB-update pipeline lives in submitManagedRpRegistration so the
 * MCP path (api_key auth) can share it.
 */
export const POST = async (req: NextRequest) => {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await req.json();
  if (body?.action?.name !== "register_rp") {
    return errorHasuraQuery({
      req,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  const userId = body.session_variables["x-hasura-user-id"];
  if (!userId) {
    return errorHasuraQuery({
      req,
      detail: "userId must be set.",
      code: "required",
    });
  }

  const { isValid, parsedParams } = await validateRequestSchema({
    value: body.input,
    schema,
  });
  if (!isValid || !parsedParams) {
    return errorHasuraQuery({
      req,
      detail: "Invalid request body.",
      code: "invalid_request",
    });
  }

  const { app_id, mode: rawMode, signer_address } = parsedParams;
  const mode = rawMode ?? "managed";

  const client = await getAPIServiceGraphqlClient();

  const { app } = await getAppInfoSdk(client).GetAppInfo({ app_id });
  if (!app || app.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "App not found.",
      code: "app_not_found",
      app_id,
      logLevel: "warn",
    });
  }
  const appInfo = app[0];
  const teamId = appInfo.team_id;

  // Permission check before revealing feature state.
  const { team } = await getCheckUserSdk(client).CheckUserInApp({
    team_id: teamId,
    app_id,
    user_id: userId,
  });
  if (!team || team.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "User does not have permission to register this app.",
      code: "unauthorized",
      app_id,
    });
  }

  if (appInfo.is_staging) {
    return errorHasuraQuery({
      req,
      detail: "Staging apps cannot be migrated to World ID 4.0.",
      code: "staging_not_supported",
      app_id,
    });
  }

  // Self-managed: just create the DB record. No KMS / on-chain work.
  if (mode === "self_managed") {
    const rpIdString = generateRpIdString(app_id);

    // A self-managed developer runs `register()` from their own wallet BEFORE
    // reaching this mutation — the instructions screen hands them the calldata
    // and this is the "Continue" that follows. So an initialized rp_id is the
    // HEALTHY state here and must not be treated as a conflict.
    //
    // The one case that has to fail is an id the Portal claimed defensively via
    // _pre-register-rp-ids: the developer's own `register()` reverted against it,
    // and handing them the id needs the manager transferred to them, which no
    // flow drives yet. Our shared manager address is what identifies that case;
    // any other manager is the developer's own registration (or a squatter's,
    // which for self-managed we cannot tell apart either way — unchanged by
    // this PR, since the Portal stores no expected roles for self-managed).
    //
    // Best-effort: a read failure must not block onboarding.
    const primaryConfig = getRpRegistryConfig();
    const sharedManagerKeyId = process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID;
    if (primaryConfig && sharedManagerKeyId) {
      try {
        const onChain = await getRpFromContract(
          parseRpId(rpIdString),
          primaryConfig.contractAddress,
        );
        if (onChain.initialized) {
          const ourManagerAddress = await resolveManagerAddress(
            sharedManagerKeyId,
            primaryConfig.kmsRegion,
          );
          if (
            ourManagerAddress &&
            addressesEqual(onChain.manager, ourManagerAddress)
          ) {
            logger.warn("Self-managed rp_id is held by the Portal's manager", {
              app_id,
              rpIdString,
              onChainManager: onChain.manager,
            });
            return errorHasuraQuery({
              req,
              detail:
                "This app's RP ID is held by Portal and cannot be self-managed yet — contact support.",
              code: "rp_id_taken",
              app_id,
            });
          }
        }
      } catch (error) {
        logger.warn("Could not pre-check on-chain RP ownership; continuing", {
          error,
          app_id,
          rpIdString,
        });
      }
    }

    const { insert_rp_registration_one: claimedSlot } = await getClaimRpSdk(
      client,
    ).ClaimRpRegistration({
      rp_id: rpIdString,
      app_id,
      mode: "self_managed",
      signer_address: null,
    });
    if (!claimedSlot) {
      return errorHasuraQuery({
        req,
        detail: "Registration already in progress or completed for this app.",
        code: "already_registered",
        app_id,
      });
    }
    logger.info("Self-managed RP registration created", {
      app_id,
      rpIdString,
    });
    return NextResponse.json({
      rp_id: rpIdString,
      manager_address: null,
      signer_address: null,
      status: RpRegistrationStatus.Pending,
      operation_hash: null,
    });
  }

  // Managed mode: delegate to the shared pipeline.
  const appName = appInfo.app_metadata?.[0]?.name || "";
  const result = await submitManagedRpRegistration({
    client,
    appId: app_id,
    signerAddress: signer_address!,
    appName,
    isStaging: appInfo.is_staging,
  });

  if (!result.ok) {
    return errorHasuraQuery({
      req,
      detail: result.detail,
      code: REGISTRATION_ERROR_HTTP_CODE[result.code],
      app_id,
    });
  }

  return NextResponse.json({
    rp_id: result.rpIdString,
    manager_address: result.managerAddress,
    signer_address: result.signerAddress,
    status: result.status,
    operation_hash: result.operationHash,
  });
};
