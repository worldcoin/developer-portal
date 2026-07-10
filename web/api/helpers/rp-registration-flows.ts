// Shared managed-mode RP registration + signer-rotation flows.
//
// These functions own the KMS + on-chain + DB-update plumbing that used to
// live inline in the Hasura action handlers. Both the Hasura action routes
// and the MCP tool reuse them so we don't have two divergent copies of the
// "register an RP / rotate its signer" pipeline.
//
// Helpers do not throw on caller-fixable errors — they return a tagged
// result so each caller (Hasura action vs JSON-RPC) can format its own
// error envelope without parsing exception messages.

import { getKMSClient, scheduleKeyDeletion } from "@/api/helpers/kms";
import { createManagerKey } from "@/api/helpers/kms-eth";
import {
  submitRegisterRpTransaction,
  submitRotateSignerTransaction,
} from "@/api/helpers/rp-transactions";
import {
  generateRpIdString,
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
  parseRpId,
  RpRegistrationStatus,
} from "@/api/helpers/rp-utils";
import { getSdk as getClaimRpSdk } from "@/api/hasura/register-rp/graphql/claim-rp-registration.generated";
import { getSdk as getDeleteRpSdk } from "@/api/hasura/register-rp/graphql/delete-rp-registration.generated";
import { getSdk as getUpdateRpSdk } from "@/api/hasura/register-rp/graphql/update-rp-registration.generated";
import { getSdk as getClaimRotationSdk } from "@/api/hasura/rotate-signer-key/graphql/claim-rotation-slot.generated";
import { getSdk as getRpRegistrationSdk } from "@/api/hasura/rotate-signer-key/graphql/get-rp-registration.generated";
import { getSdk as getRevertStatusSdk } from "@/api/hasura/rotate-signer-key/graphql/revert-rotation-status.generated";
import { getSdk as getUpdateResultSdk } from "@/api/hasura/rotate-signer-key/graphql/update-rotation-result.generated";
import { getSdk as getUpdateStagingResultSdk } from "@/api/hasura/rotate-signer-key/graphql/update-staging-rotation-result.generated";
import { logger } from "@/lib/logger";
import { GraphQLClient } from "graphql-request";

export type ManagedRegistrationResult =
  | {
      ok: true;
      rpIdString: string;
      managerAddress: string;
      signerAddress: string;
      operationHash: string;
      status: RpRegistrationStatus;
      stagingOperationHash: string | null;
      stagingStatus: string | null;
    }
  | {
      ok: false;
      code:
        | "staging_not_supported"
        | "config_error"
        | "already_registered"
        | "kms_error"
        | "submission_error"
        | "db_error";
      detail: string;
    };

/**
 * Run the full managed-mode RP registration pipeline (slot claim → KMS
 * manager key → on-chain submission [primary + best-effort staging] → DB
 * update). Caller is responsible for upstream auth: the Hasura action
 * verifies the user has ADMIN/OWNER on the team; the MCP verifies the
 * api_key is scoped to the team.
 */
export async function submitManagedRpRegistration({
  client,
  appId,
  signerAddress,
  appName,
  isStaging,
}: {
  client: GraphQLClient;
  appId: string;
  signerAddress: string;
  appName: string;
  isStaging: boolean;
}): Promise<ManagedRegistrationResult> {
  if (isStaging) {
    return {
      ok: false,
      code: "staging_not_supported",
      detail: "Staging apps cannot be migrated to World ID 4.0.",
    };
  }

  const primaryConfig = getRpRegistryConfig();
  if (!primaryConfig) {
    return {
      ok: false,
      code: "config_error",
      detail: "Missing required environment variables for RP Registry.",
    };
  }

  const rpIdString = generateRpIdString(appId);

  // Claim the registration slot. on_conflict with empty update_columns
  // means: if a row already exists, return null and we bail.
  const { insert_rp_registration_one: claimedSlot } = await getClaimRpSdk(
    client,
  ).ClaimRpRegistration({
    rp_id: rpIdString,
    app_id: appId,
    mode: "managed",
    signer_address: signerAddress,
  });
  if (!claimedSlot) {
    return {
      ok: false,
      code: "already_registered",
      detail: "Registration already in progress or completed for this app.",
    };
  }

  const rpId = parseRpId(rpIdString);

  // Slot is now claimed; any failure between here and the final DB write
  // must release it so retries don't bounce off `already_registered`.
  let kmsClient;
  try {
    kmsClient = await getKMSClient(primaryConfig.kmsRegion);
  } catch (error) {
    logger.error("Failed to initialize KMS client for registration", {
      error,
      app_id: appId,
    });
    await getDeleteRpSdk(client).DeleteRpRegistration({ rp_id: rpIdString });
    return {
      ok: false,
      code: "kms_error",
      detail: "Failed to initialize KMS client.",
    };
  }

  const managerKeyResult = await createManagerKey(kmsClient, rpIdString);
  if (!managerKeyResult) {
    await getDeleteRpSdk(client).DeleteRpRegistration({ rp_id: rpIdString });
    return {
      ok: false,
      code: "kms_error",
      detail: "Failed to create manager key.",
    };
  }

  const { keyId: managerKmsKeyId, address: managerAddress } = managerKeyResult;

  let operationHash: string;
  try {
    operationHash = await submitRegisterRpTransaction(primaryConfig, {
      rpId,
      managerAddress,
      signerAddress,
      appName,
      kmsClient,
    });
  } catch (error) {
    logger.error("Failed to submit registration transaction", {
      error,
      app_id: appId,
    });
    await scheduleKeyDeletion(kmsClient, managerKmsKeyId);
    await getDeleteRpSdk(client).DeleteRpRegistration({ rp_id: rpIdString });
    return {
      ok: false,
      code: "submission_error",
      detail: "Failed to submit registration transaction.",
    };
  }

  // Best-effort duplicate to staging contract on production deployments.
  // A failure here doesn't fail the whole registration; we just record the
  // staging status so the UI can surface a retry button.
  let stagingOperationHash: string | null = null;
  let stagingStatus: string | null = null;
  if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
    const stagingConfig = getStagingRpRegistryConfig();
    if (stagingConfig) {
      try {
        stagingOperationHash = await submitRegisterRpTransaction(
          stagingConfig,
          {
            rpId,
            managerAddress,
            signerAddress,
            appName,
            kmsClient,
          },
        );
        stagingStatus = RpRegistrationStatus.Pending;
        logger.info("Staging registration submitted", {
          rpIdString,
          operationHash: stagingOperationHash,
          contractAddress: stagingConfig.contractAddress,
        });
      } catch (error) {
        stagingStatus = RpRegistrationStatus.Failed;
        logger.error("Staging registration failed", {
          error,
          rpIdString,
          contractAddress: stagingConfig.contractAddress,
        });
      }
    }
  }

  let updatedRegistration;
  try {
    const { update_rp_registration_by_pk } = await getUpdateRpSdk(
      client,
    ).UpdateRpRegistration({
      rp_id: rpIdString,
      manager_kms_key_id: managerKmsKeyId,
      operation_hash: operationHash,
      staging_operation_hash: stagingOperationHash,
      staging_status: stagingStatus,
    });
    updatedRegistration = update_rp_registration_by_pk;
  } catch (error) {
    // On-chain TX is already in flight; the DB write threw, leaving the
    // slot held without manager_kms_key_id / operation_hash. Logging the
    // op hash here gives ops a way to reconcile the on-chain state. We
    // intentionally do NOT delete the slot — the row's existence prevents
    // a second registerRp transaction from being submitted on retry.
    logger.error("DB write failed after registration submission", {
      error,
      app_id: appId,
      rpIdString,
      managerAddress,
      operationHash,
    });
    return {
      ok: false,
      code: "db_error",
      detail: "Failed to update registration record.",
    };
  }

  if (!updatedRegistration) {
    // Same situation, just no exception.
    return {
      ok: false,
      code: "db_error",
      detail: "Failed to update registration record.",
    };
  }

  logger.info("RP registration successful", {
    app_id: appId,
    rpIdString,
    managerAddress,
    operationHash,
  });

  return {
    ok: true,
    rpIdString,
    managerAddress,
    signerAddress,
    operationHash,
    status: RpRegistrationStatus.Pending,
    stagingOperationHash,
    stagingStatus,
  };
}

export type ManagedRotationResult =
  | {
      ok: true;
      rpIdString: string;
      newSignerAddress: string;
      oldSignerAddress: string;
      operationHash: string;
      status: "pending";
    }
  | {
      ok: false;
      code:
        | "config_error"
        | "rp_not_registered"
        | "app_not_active"
        | "self_managed_mode"
        | "rotation_in_progress"
        | "submission_error"
        | "db_error";
      detail: string;
    };

/**
 * Run the full managed-mode signer-rotation pipeline (slot claim → on-chain
 * submission [primary + staging best-effort] → DB update → cache bust).
 * Caller is responsible for upstream auth.
 */
export async function submitManagedSignerRotation({
  client,
  appId,
  newSignerAddress,
}: {
  client: GraphQLClient;
  appId: string;
  newSignerAddress: string;
}): Promise<ManagedRotationResult> {
  const primaryConfig = getRpRegistryConfig();
  if (!primaryConfig) {
    return {
      ok: false,
      code: "config_error",
      detail: "Missing required environment variables for RP Registry.",
    };
  }

  const { rp_registration } = await getRpRegistrationSdk(
    client,
  ).GetRpRegistration({ app_id: appId });

  if (!rp_registration || rp_registration.length === 0) {
    return {
      ok: false,
      code: "rp_not_registered",
      detail: "RP registration not found for this app.",
    };
  }

  const registration = rp_registration[0];
  const rpIdString = registration.rp_id;
  const oldSignerAddress = registration.signer_address || "";
  const app = registration.app;

  if (app.status !== "active" || app.is_archived || app.deleted_at) {
    return {
      ok: false,
      code: "app_not_active",
      detail: "App not found. App may be inactive, archived, or deleted.",
    };
  }

  if (registration.mode !== "managed" || !registration.manager_kms_key_id) {
    return {
      ok: false,
      code: "self_managed_mode",
      detail:
        "RP is in self-managed mode. You must handle signer key rotation yourself.",
    };
  }

  const managerKmsKeyId = registration.manager_kms_key_id;

  const { update_rp_registration: claimResult } = await getClaimRotationSdk(
    client,
  ).ClaimRotationSlot({ rp_id: rpIdString });
  if (!claimResult || claimResult.affected_rows === 0) {
    return {
      ok: false,
      code: "rotation_in_progress",
      detail:
        "Cannot rotate signer key. RP status is not 'registered' (rotation may already be in progress).",
    };
  }

  const rpId = parseRpId(rpIdString);

  const revertStatus = async () => {
    try {
      await getRevertStatusSdk(client).RevertRotationStatus({
        rp_id: rpIdString,
      });
    } catch (revertError) {
      logger.error("Failed to revert rotation status", {
        error: revertError,
        app_id: appId,
        rpIdString,
      });
    }
  };

  // From here on the RP status is `pending`; any unhandled exception or
  // tagged failure must revert it so the user can retry. Otherwise a
  // transient KMS / Hasura blip would leave the RP wedged in `pending`
  // and every subsequent rotate would short-circuit on
  // rotation_in_progress until an operator reset it manually.
  let kmsClient;
  let operationHash: string;
  try {
    kmsClient = await getKMSClient(primaryConfig.kmsRegion);
  } catch (error) {
    logger.error("Failed to initialize KMS client for rotation", {
      error,
      app_id: appId,
    });
    await revertStatus();
    return {
      ok: false,
      code: "submission_error",
      detail: "Failed to initialize KMS client.",
    };
  }

  try {
    operationHash = await submitRotateSignerTransaction(primaryConfig, {
      rpId,
      newSignerAddress,
      managerKmsKeyId,
      kmsClient,
    });
  } catch (error) {
    logger.error("Failed to submit signer rotation transaction", {
      error,
      app_id: appId,
    });
    await revertStatus();
    return {
      ok: false,
      code: "submission_error",
      detail: "Failed to submit signer rotation transaction.",
    };
  }

  // Best-effort staging duplication on production.
  let stagingHash: string | null = null;
  let stagingStatusToWrite: RpRegistrationStatus | null = null;
  if (process.env.NEXT_PUBLIC_APP_ENV === "production") {
    const stagingConfig = getStagingRpRegistryConfig();
    if (stagingConfig) {
      try {
        stagingHash = await submitRotateSignerTransaction(stagingConfig, {
          rpId,
          newSignerAddress,
          managerKmsKeyId,
          kmsClient,
        });
        stagingStatusToWrite = RpRegistrationStatus.Pending;
        logger.info("Staging signer rotation submitted", {
          rpIdString,
          operationHash: stagingHash,
          contractAddress: stagingConfig.contractAddress,
        });
      } catch (error) {
        stagingStatusToWrite = RpRegistrationStatus.Failed;
        logger.error("Staging signer rotation failed", {
          error,
          rpIdString,
          contractAddress: stagingConfig.contractAddress,
        });
      }
    }
  }

  let updatedRegistration;
  try {
    const { update_rp_registration_by_pk } = await getUpdateResultSdk(
      client,
    ).UpdateRotationResult({
      rp_id: rpIdString,
      signer_address: newSignerAddress,
      operation_hash: operationHash,
    });
    updatedRegistration = update_rp_registration_by_pk;
  } catch (error) {
    // On-chain TX already submitted; we still revert so the user can
    // retry instead of being stuck on rotation_in_progress. Operations
    // can dedupe via the operation_hash logged here.
    logger.error("DB write failed after rotation submission; reverting", {
      error,
      app_id: appId,
      rpIdString,
      operationHash,
    });
    await revertStatus();
    return {
      ok: false,
      code: "db_error",
      detail: "Failed to update registration record.",
    };
  }
  if (!updatedRegistration) {
    logger.error("Failed to update registration record after submission", {
      app_id: appId,
      rpIdString,
      operationHash,
    });
    await revertStatus();
    return {
      ok: false,
      code: "db_error",
      detail: "Failed to update registration record.",
    };
  }

  if (stagingStatusToWrite) {
    try {
      await getUpdateStagingResultSdk(client).UpdateStagingRotationResult({
        rp_id: rpIdString,
        staging_status: stagingStatusToWrite,
        staging_operation_hash: stagingHash,
      });
    } catch (error) {
      logger.error("Failed to persist staging rotation result", {
        error,
        rpIdString,
        staging_status: stagingStatusToWrite,
      });
    }
  }

  // Bust the rp_status cache so the next poll re-reads on-chain state.
  const redis = global.RedisClient;
  if (redis) {
    try {
      await redis.del(`rp_status:v2:${rpIdString}`);
    } catch (cacheError) {
      logger.warn("Failed to invalidate rp_status cache", {
        error: cacheError,
        rpIdString,
      });
    }
  }

  logger.info("Signer key rotation successful", {
    app_id: appId,
    rpIdString,
    oldSignerAddress,
    newSignerAddress,
    operationHash,
  });

  return {
    ok: true,
    rpIdString,
    newSignerAddress,
    oldSignerAddress,
    status: "pending",
    operationHash,
  };
}
