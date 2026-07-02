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
  submitToggleRpActiveTransaction,
} from "@/api/helpers/rp-transactions";
import {
  generateRpIdString,
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
  parseRpId,
  RpRegistrationStatus,
} from "@/api/helpers/rp-utils";
import { getRpFromContract } from "@/api/helpers/temporal-rpc";
import { USER_OP_MAX_VALIDITY_MS } from "@/api/helpers/user-operation";
import { getSdk as getClaimRpSdk } from "@/api/hasura/register-rp/graphql/claim-rp-registration.generated";
import { getSdk as getDeleteRpSdk } from "@/api/hasura/register-rp/graphql/delete-rp-registration.generated";
import { getSdk as getUpdateRpSdk } from "@/api/hasura/register-rp/graphql/update-rp-registration.generated";
import { getSdk as getClaimRotationSdk } from "@/api/hasura/rotate-signer-key/graphql/claim-rotation-slot.generated";
import { getSdk as getRpRegistrationSdk } from "@/api/hasura/rotate-signer-key/graphql/get-rp-registration.generated";
import { getSdk as getRevertStatusSdk } from "@/api/hasura/rotate-signer-key/graphql/revert-rotation-status.generated";
import { getSdk as getUpdateResultSdk } from "@/api/hasura/rotate-signer-key/graphql/update-rotation-result.generated";
import { getSdk as getUpdateStagingResultSdk } from "@/api/hasura/rotate-signer-key/graphql/update-staging-rotation-result.generated";
import { getSdk as getClaimToggleSdk } from "@/api/hasura/toggle-rp-active/graphql/claim-toggle-slot.generated";
import { getSdk as getResetStalePendingSdk } from "@/api/hasura/toggle-rp-active/graphql/reset-stale-pending-rp.generated";
import { getSdk as getRevertToggleSdk } from "@/api/hasura/toggle-rp-active/graphql/revert-toggle-status.generated";
import { getSdk as getUpdateToggleSdk } from "@/api/hasura/toggle-rp-active/graphql/update-toggle-result.generated";
import { getSdk as getUpdateRpStatusSdk } from "@/api/v4/rp-status/[rp_id]/graphql/update-rp-status.generated";
import { getSdk as getUpdateStagingStatusSdk } from "@/api/v4/rp-status/[rp_id]/graphql/update-staging-status.generated";
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
        | "app_inactive"
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

  // A deleted / archived / inactive app must not be able to rotate its signer.
  // Mirrors the app-state guard in the v4 verify endpoint so a soft-deleted
  // app's managed signer can't be rotated or kept alive from the dashboard.
  const app = registration.app;
  if (app.deleted_at || app.status !== "active" || app.is_archived) {
    return {
      ok: false,
      code: "app_inactive",
      detail: "App is deleted, archived, or inactive.",
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

export type ManagedDeactivationResult =
  | {
      ok: true;
      // "submitted" → we sent an on-chain deactivation tx;
      // "skipped"   → nothing to do (no RP, self-managed, already inactive, raced).
      outcome: "submitted" | "skipped";
      reason?:
        | "no_rp"
        | "self_managed"
        | "in_flight"
        | "already_inactive"
        | "concurrent";
      rpIdString?: string;
      operationHash?: string;
    }
  | {
      ok: false;
      code: "config_error" | "rpc_error" | "submission_error";
      detail: string;
      rpIdString?: string;
    };

// A `pending` managed RP has an in-flight UserOp (a register / rotate / toggle
// that has not settled). We must not act on it until that op is *provably dead*
// — i.e. its on-chain validity window (validUntil = submit + USER_OP_MAX_VALIDITY_MS)
// has fully elapsed. Acting sooner risks the original op landing *after* we read
// chain state, which would either (a) re-activate an RP we just marked
// `deactivated` because it read as not-yet-initialized, or (b) cancel out a
// fresh toggle we submitted (toggleActive *flips* rather than sets `active`).
// The extra margin covers server/chain clock skew and the beat between op
// submission and the `updated_at` write.
const PENDING_SETTLE_MARGIN_MS = 5 * 60 * 1000;
const PENDING_IN_FLIGHT_GRACE_MS =
  USER_OP_MAX_VALIDITY_MS + PENDING_SETTLE_MARGIN_MS;

/**
 * Deactivate a managed RP on-chain when its app is deleted. Shared by the
 * delete flow (inline) and the reconciliation cron that sweeps soft-deleted
 * apps whose RP is still live (and backfills apps deleted before this existed).
 *
 * Idempotency: the decision to submit a `toggleActive` transaction is gated on
 * a *fresh on-chain read*, never on the DB status. `toggleActive` flips state,
 * so a blind re-run would re-activate an already-deactivated RP — instead we
 * only submit when the chain still reports the RP active, and we converge the
 * DB to `deactivated` (no transaction) when it is already inactive. This makes
 * retries and repeated cron passes safe.
 *
 * Deliberately NOT gated on the World ID 4.0 feature flag: if a managed RP is
 * live on-chain we tear it down regardless of the team's current flag state.
 * The caller owns auth (app-owner check for the delete flow; internal secret
 * for the cron).
 */
export async function submitManagedRpDeactivation({
  client,
  appId,
}: {
  client: GraphQLClient;
  appId: string;
}): Promise<ManagedDeactivationResult> {
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
    return { ok: true, outcome: "skipped", reason: "no_rp" };
  }

  const registration = rp_registration[0];
  const rpIdString = registration.rp_id;

  // Only managed RPs with a manager key can be torn down by the portal;
  // self-managed developers own their own on-chain lifecycle.
  if (registration.mode !== "managed" || !registration.manager_kms_key_id) {
    return { ok: true, outcome: "skipped", reason: "self_managed", rpIdString };
  }
  const managerKmsKeyId = registration.manager_kms_key_id;
  const currentStatus = registration.status as RpRegistrationStatus;
  const currentStagingStatus =
    registration.staging_status as RpRegistrationStatus | null;
  const rpId = parseRpId(rpIdString);

  // A `pending` row means a toggle/rotate is already in flight. Don't stack a
  // second toggleActive on top of it — toggle *flips* the active flag, so two
  // in-flight toggles can cancel out and leave the RP active. Treat it as
  // actionable only once it is older than the in-flight grace window; by then
  // the prior tx has settled and the on-chain read below is authoritative
  // (mined → inactive → skip; failed → still active → safe to resubmit).
  if (currentStatus === RpRegistrationStatus.Pending) {
    const ageMs = Date.now() - new Date(registration.updated_at).getTime();
    if (ageMs < PENDING_IN_FLIGHT_GRACE_MS) {
      return { ok: true, outcome: "skipped", reason: "in_flight", rpIdString };
    }
  }

  // Authoritative on-chain state drives the decision — see the idempotency
  // note above. A failed read is retryable, so don't touch anything.
  let onChainInitialized: boolean;
  let onChainActive: boolean;
  try {
    const onChainRp = await getRpFromContract(
      rpId,
      primaryConfig.contractAddress,
    );
    onChainInitialized = onChainRp.initialized;
    onChainActive = onChainRp.active;
  } catch (error) {
    logger.error("Failed to read on-chain RP state for deactivation", {
      error,
      app_id: appId,
      rpIdString,
    });
    return {
      ok: false,
      code: "rpc_error",
      detail: "Failed to read on-chain RP state.",
      rpIdString,
    };
  }

  const primaryActive = onChainInitialized && onChainActive;

  // A managed RP is mirrored on the staging contract in production, and the
  // happy path deactivates both. Read staging up front so the terminal decision
  // considers *both* contracts: marking the row `deactivated` on the primary
  // read alone would let the cron (which skips `deactivated` rows) strand a
  // still-active staging signer for a deleted app indefinitely. A failed read
  // means we can't prove staging is inactive, so we must not finalize on it.
  let stagingActive = false;
  let stagingReadOk = true;
  const stagingConfig =
    process.env.NEXT_PUBLIC_APP_ENV === "production"
      ? getStagingRpRegistryConfig()
      : null;
  if (stagingConfig) {
    try {
      const stagingRp = await getRpFromContract(
        rpId,
        stagingConfig.contractAddress,
      );
      stagingActive = stagingRp.initialized && stagingRp.active;
    } catch (error) {
      stagingReadOk = false;
      logger.error("Failed to read staging RP state for deactivation", {
        error,
        app_id: appId,
        rpIdString,
        contractAddress: stagingConfig.contractAddress,
      });
    }
  }

  // Nothing active on either contract: no transaction needed. Converge the DB
  // so the reconciliation cron stops re-selecting this row.
  // Reaching here with `!onChainInitialized` for a `pending` row is only
  // possible once its register op has expired (guaranteed by the in-flight
  // grace window above), so marking it terminal can't strand a registration
  // that is still able to land and flip the RP back to active.
  if (!primaryActive && !stagingActive) {
    // If staging couldn't be read we can't prove it inactive; leave the row
    // eligible so a later pass finalizes once the read succeeds, rather than
    // terminally marking it dead on the primary contract alone.
    if (!stagingReadOk) {
      return {
        ok: false,
        code: "rpc_error",
        detail: "Failed to read staging RP state.",
        rpIdString,
      };
    }
    if (currentStatus !== RpRegistrationStatus.Deactivated) {
      try {
        await getUpdateRpStatusSdk(client).UpdateRpStatus({
          rp_id: rpIdString,
          status: RpRegistrationStatus.Deactivated,
        });
      } catch (error) {
        logger.warn("Failed to mark already-inactive RP as deactivated", {
          error,
          app_id: appId,
          rpIdString,
        });
      }
    }
    // Downgrade a stale `registered` staging status now that staging reads
    // inactive, so the cron (which also selects rows whose staging is still
    // `registered`) stops re-selecting this row.
    if (currentStagingStatus === RpRegistrationStatus.Registered) {
      try {
        await getUpdateStagingStatusSdk(client).UpdateStagingStatus({
          rp_id: rpIdString,
          staging_status: RpRegistrationStatus.Deactivated,
        });
      } catch (error) {
        logger.warn(
          "Failed to mark already-inactive staging RP as deactivated",
          {
            error,
            app_id: appId,
            rpIdString,
          },
        );
      }
    }
    return {
      ok: true,
      outcome: "skipped",
      reason: "already_inactive",
      rpIdString,
    };
  }

  // At least one contract is still ACTIVE. A stale `pending` row (the only way
  // we reach here with pending — fresh ones returned above) means the prior
  // toggle never settled; reset it to `registered` with a compare-and-swap so
  // the claim below is always gated by a real status transition. A bare
  // `pending → pending` claim would not serialize concurrent attempts, and two
  // submitted toggles would flip the RP back to active. The single claim below
  // covers both the primary and the staging toggle: the row goes `pending`
  // (updated_at bumped), so the in-flight grace skips it until the op(s) settle.
  let claimStatus = currentStatus;
  if (currentStatus === RpRegistrationStatus.Pending) {
    // Scope the reset to the exact row version we observed (updated_at), so a
    // racing pass that already reset + re-claimed this row to a *fresh*
    // pending can't have it reset out from under it and re-submitted.
    const { update_rp_registration: resetResult } =
      await getResetStalePendingSdk(client).ResetStalePendingRp({
        rp_id: rpIdString,
        updated_at: registration.updated_at,
      });
    if (!resetResult || resetResult.affected_rows === 0) {
      // Another pass already reset/claimed it (or it is no longer the stale
      // row we read).
      return { ok: true, outcome: "skipped", reason: "concurrent", rpIdString };
    }
    claimStatus = RpRegistrationStatus.Registered;
  }

  // Claim the slot (claimStatus → pending) — a real status transition, so it
  // serializes against a concurrent toggle/rotate or another cron pass. If the
  // row already moved, bail rather than risk a double toggle.
  const { update_rp_registration: claimResult } = await getClaimToggleSdk(
    client,
  ).ClaimToggleSlot({ rp_id: rpIdString, current_status: claimStatus });
  if (!claimResult || claimResult.affected_rows === 0) {
    return { ok: true, outcome: "skipped", reason: "concurrent", rpIdString };
  }

  // The slot is `pending`. A pre-submission failure must revert it so a later
  // pass can retry; reverting is safe because every pass re-reads on-chain
  // state first and skips an RP that is already inactive.
  const revertStatus = async () => {
    try {
      await getRevertToggleSdk(client).RevertToggleStatus({
        rp_id: rpIdString,
        previous_status: claimStatus,
      });
    } catch (revertError) {
      logger.error("Failed to revert deactivation status", {
        error: revertError,
        app_id: appId,
        rpIdString,
      });
    }
  };

  let kmsClient;
  try {
    kmsClient = await getKMSClient(primaryConfig.kmsRegion);
  } catch (error) {
    logger.error("Failed to initialize KMS client for deactivation", {
      error,
      app_id: appId,
      rpIdString,
    });
    await revertStatus();
    return {
      ok: false,
      code: "submission_error",
      detail: "Failed to initialize KMS client.",
      rpIdString,
    };
  }

  // Toggle each contract that is still active. `toggleActive` flips state, so we
  // must never toggle one that already reads inactive (that would re-enable it).
  // The primary toggle is the main event; staging is best-effort — unless it is
  // the only active contract, in which case its failure is handled by the
  // "nothing submitted" revert below.
  let operationHash: string | null = null;
  if (primaryActive) {
    try {
      operationHash = await submitToggleRpActiveTransaction(primaryConfig, {
        rpId,
        managerKmsKeyId,
        kmsClient,
      });
    } catch (error) {
      logger.error("Failed to submit RP deactivation transaction", {
        error,
        app_id: appId,
        rpIdString,
      });
      await revertStatus();
      return {
        ok: false,
        code: "submission_error",
        detail: "Failed to submit RP deactivation transaction.",
        rpIdString,
      };
    }
  }

  let stagingOperationHash: string | null = null;
  if (stagingActive && stagingConfig) {
    try {
      stagingOperationHash = await submitToggleRpActiveTransaction(
        stagingConfig,
        { rpId, managerKmsKeyId, kmsClient },
      );
      logger.info("Staging RP deactivation submitted", {
        rpIdString,
        operationHash: stagingOperationHash,
        contractAddress: stagingConfig.contractAddress,
      });
    } catch (error) {
      logger.error("Staging RP deactivation failed", {
        error,
        rpIdString,
        contractAddress: stagingConfig.contractAddress,
      });
    }
  }

  // Nothing was submitted (e.g. the staging-only path failed to submit its
  // toggle). Release the slot so a later pass retries — leaving it `pending`
  // with no in-flight op would wedge it for the whole grace window.
  if (!operationHash && !stagingOperationHash) {
    await revertStatus();
    return {
      ok: false,
      code: "submission_error",
      detail: "Failed to submit RP deactivation transaction.",
      rpIdString,
    };
  }

  // Record the primary operation hash when we submitted one. The row stays
  // `pending` until the on-chain state settles — reconciled by the rp-status
  // endpoint, or by a later cron pass for deleted apps that are no longer
  // polled. We do NOT flip to `deactivated` here because the transaction may
  // still revert on-chain; leaving it `pending` (rather than reverting) also
  // stops the cron from submitting a second toggle on top of the in-flight one
  // within the grace window. When only staging was toggled there is no new
  // primary op hash to persist (the mutation requires one); the claim already
  // left the row `pending` with a fresh updated_at, which is what protects the
  // staging toggle from a double-submit — the hash is logged above.
  if (operationHash) {
    try {
      const { update_rp_registration_by_pk: updated } =
        await getUpdateToggleSdk(client).UpdateToggleResult({
          rp_id: rpIdString,
          operation_hash: operationHash,
          staging_operation_hash: stagingOperationHash,
        });
      if (!updated) {
        logger.error("Failed to persist deactivation operation hash", {
          app_id: appId,
          rpIdString,
          operationHash,
        });
      }
    } catch (error) {
      logger.error("DB write failed after deactivation submission", {
        error,
        app_id: appId,
        rpIdString,
        operationHash,
      });
    }
  }

  // Bust the rp_status cache so the next read re-fetches on-chain state.
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

  logger.info("RP deactivation submitted", {
    app_id: appId,
    rpIdString,
    operationHash,
    stagingOperationHash,
  });

  return {
    ok: true,
    outcome: "submitted",
    rpIdString,
    operationHash: operationHash ?? undefined,
  };
}
