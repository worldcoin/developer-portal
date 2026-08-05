import { getSdk as getCheckUserSdk } from "@/api/hasura/graphql/checkUserInApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  submitManagedRpRegistration,
  type ManagedRegistrationResult,
} from "@/api/helpers/rp-registration-flows";
import {
  candidateRpIdsForApp,
  resolveRpIdForNewRegistration,
} from "@/api/helpers/rp-id";
import {
  getRpRegistryConfig,
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
    let rpIdString: string;
    try {
      // Must match what getSelfManagedRegistrationInfo showed the developer —
      // they have already submitted register(uint64 rpId, ...) on-chain with
      // that number. Both call the same resolver so they cannot drift.
      rpIdString = resolveRpIdForNewRegistration(app_id);
    } catch (error) {
      logger.error("Cannot derive an rp_id for self-managed registration", {
        error,
        app_id,
      });
      return errorHasuraQuery({
        req,
        detail: "RP Registry is not configured correctly.",
        code: "config_error",
        app_id,
      });
    }

    // ...unless the derivation changed between the two reads. The developer saw
    // a number on the instructions screen and registered THAT one on-chain from
    // their own wallet; if the flag flipped in between — a rolling deploy serving
    // the two requests from tasks with different env, or a rollback — deriving
    // again here yields a different id, and we would store a row for an id nobody
    // registered while their real registration is orphaned. Self-managed rows
    // never time out, so that app would be stuck until manual cleanup.
    //
    // Prefer whichever candidate the chain says is actually registered. Both are
    // derived from the app_id server-side, so this cannot be steered into
    // claiming an arbitrary id. Best-effort: if the reads fail, keep the
    // currently-derived id, which is the pre-existing behaviour.
    const selfManagedConfig = getRpRegistryConfig();
    const candidates = candidateRpIdsForApp(app_id);
    if (selfManagedConfig && candidates.length > 1) {
      for (const candidate of candidates) {
        try {
          const onChain = await getRpFromContract(
            parseRpId(candidate),
            selfManagedConfig.contractAddress,
          );
          if (onChain.initialized) {
            if (candidate !== rpIdString) {
              logger.warn(
                "Self-managed rp_id scheme changed mid-flow; using the id the developer registered",
                { app_id, derived: rpIdString, registered: candidate },
              );
              rpIdString = candidate;
            }
            break;
          }
        } catch (error) {
          logger.warn("Could not read on-chain state for an rp_id candidate", {
            error,
            app_id,
            candidate,
          });
        }
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
