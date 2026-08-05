import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { resolveManagerAddress } from "@/api/helpers/rp-manager";
import {
  evaluateOnChainTrust,
  isValidRpId,
  mapOnChainToDbStatus,
  type OnChainTrust,
  parseRpId,
  RpRegistrationStatus,
} from "@/api/helpers/rp-utils";
import { getRpFromContract } from "@/api/helpers/temporal-rpc";
import { USER_OP_MAX_VALIDITY_MS } from "@/api/helpers/user-operation";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getGetRpRegistrationSdk } from "./graphql/get-rp-registration.generated";
import { getSdk as getUpdateRpStatusSdk } from "./graphql/update-rp-status.generated";
import { getSdk as getUpdateStagingStatusSdk } from "./graphql/update-staging-status.generated";

const CACHE_TTL_SECONDS = 3600;
const CACHE_KEY_PREFIX = "rp_status:v2:";
const PENDING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const SIGNER_MISMATCH_LOG_KEY_PREFIX = "rp_signer_mismatch_logged:";
const SIGNER_MISMATCH_LOG_TTL_SECONDS = 600; // 10 minutes

interface DualStatus {
  production_status: string;
  staging_status: string | null;
}

/**
 * Whether to emit the signer-mismatch warning for this rp_id now, at most once
 * per SIGNER_MISMATCH_LOG_TTL_SECONDS. Fails open: with no Redis, or if Redis
 * errors, we log — being noisy beats losing a takeover signal.
 */
async function shouldLogSignerMismatch(rpId: string): Promise<boolean> {
  const redis = global.RedisClient;
  if (!redis) {
    return true;
  }
  try {
    const claimed = await redis.set(
      `${SIGNER_MISMATCH_LOG_KEY_PREFIX}${rpId}`,
      "1",
      "EX",
      SIGNER_MISMATCH_LOG_TTL_SECONDS,
      "NX",
    );
    return claimed === "OK";
  } catch {
    return true;
  }
}

/**
 * Returns the registration status of an RP for both production and staging contracts.
 * Checks cache first, then DB + on-chain.
 * Syncs DB status based on the production contract only.
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ rp_id: string }> },
) {
  const params = await props.params;
  const rpId = params.rp_id;

  if (!isValidRpId(rpId)) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_rp_id",
      detail: "Invalid rp_id format. Must start with 'rp_'.",
      attribute: "rp_id",
      req,
    });
  }

  const redis = global.RedisClient;

  if (redis) {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${rpId}`;
      const cachedValue = await redis.get(cacheKey);

      if (cachedValue) {
        try {
          const parsed = JSON.parse(cachedValue) as DualStatus;
          return NextResponse.json(parsed, { status: 200 });
        } catch {
          // Legacy single-status cache entry, ignore and re-fetch
        }
      }
    } catch (error) {
      logger.warn("Failed to read from cache", { rpId, error });
    }
  }

  const client = await getAPIServiceGraphqlClient();
  const { rp_registration_by_pk: dbRecord } = await getGetRpRegistrationSdk(
    client,
  ).GetRpRegistration({ rp_id: rpId });

  if (!dbRecord) {
    return errorResponse({
      statusCode: 404,
      code: "not_found",
      detail: "RP not found.",
      attribute: "rp_id",
      req,
    });
  }

  const currentDbStatus = dbRecord.status as RpRegistrationStatus;
  const currentDbStagingStatus =
    (dbRecord.staging_status as RpRegistrationStatus) ?? null;

  // A deleted app's RP lifecycle is owned by the deactivation flow (delete-time
  // teardown + the reconciliation cron), which relies on the `pending` status as
  // an in-flight marker so it never double-submits a `toggleActive`. Public
  // status polling must therefore not write this row back — clobbering `pending`
  // with the still-active on-chain reading would let the cron fire a second
  // toggle while the first is still valid, and two flips leave the RP active.
  // Reads still return live on-chain state; only the DB writeback is skipped.
  const isAppDeleted = Boolean(dbRecord.app?.deleted_at);

  const productionContractAddress = process.env.RP_REGISTRY_CONTRACT_ADDRESS;
  if (!productionContractAddress) {
    logger.error("RP_REGISTRY_CONTRACT_ADDRESS not configured");
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Server configuration error.",
      attribute: null,
      req,
    });
  }

  const stagingContractAddress =
    process.env.RP_REGISTRY_STAGING_CONTRACT_ADDRESS || null;

  const numericRpId = parseRpId(rpId);

  // Address of the Portal's manager key for this row, resolved once and shared
  // by the production and staging checks (the same manager key is used on both
  // contracts). `null` here means "couldn't resolve", which evaluateOnChainTrust
  // maps to `unknown` rather than `untrusted`.
  // The region matters: manager keys are created in RP_REGISTRY_KMS_REGION, but
  // getKMSClient defaults to AWS_REGION_NAME. If those differ, GetPublicKey fails
  // for every managed row, every trust verdict becomes `unknown`, and no managed
  // RP is ever promoted to `registered`.
  const expectedManager = dbRecord.manager_kms_key_id
    ? await resolveManagerAddress(
        dbRecord.manager_kms_key_id,
        process.env.RP_REGISTRY_KMS_REGION,
      )
    : null;

  // Fetch production on-chain state
  let productionStatus: string;
  let productionInitialized = false;
  // How far the on-chain production reading can be trusted for this row — see
  // evaluateOnChainTrust. Mirrors the staging check below: a managed RP is only
  // promoted to its on-chain status when the on-chain manager AND signer are
  // ours, so a foreign on-chain register() can't flip the row to `registered`
  // and bind the app's branding to a foreign OPRF signer.
  let productionTrust: OnChainTrust = "unknown";
  try {
    const onChainRp = await getRpFromContract(
      numericRpId,
      productionContractAddress,
    );
    productionInitialized = onChainRp.initialized;

    if (onChainRp.initialized) {
      productionTrust = evaluateOnChainTrust({
        mode: dbRecord.mode,
        onChainManager: onChainRp.manager,
        onChainSigner: onChainRp.signer,
        expectedSigner: dbRecord.signer_address,
        expectedManager,
      });

      if (productionTrust === "trusted") {
        productionStatus = mapOnChainToDbStatus(
          onChainRp.initialized,
          onChainRp.active,
        );
      } else {
        // Not provably ours. Preserve the DB status instead of promoting — for a
        // managed RP this is an in-flight signer rotation, a foreign takeover of
        // the rp_id, or (when `unknown`) an unresolvable manager key.
        productionStatus = currentDbStatus;

        // An already-`registered` row that reads `untrusted` is categorically
        // worse than a pending one: proof-context and /api/v4/verify gate on the
        // stored status, so the Portal is actively serving this app's verified
        // branding over an OPRF signer we have just proven is not ours. It still
        // is not safe to demote it from here — this is an unauthenticated
        // polling endpoint, and if a cohort of rows has a stale
        // manager_kms_key_id then auto-demoting would take World ID verification
        // down for working apps on the strength of our own bad data. So the
        // status is preserved and the condition is escalated instead, for a
        // human to resolve out of band (the audit is: managed rows at
        // `registered` whose on-chain manager/signer differ from the row's).
        //
        // The two logged signer values are the discriminator: a takeover
        // mismatches BOTH manager and signer, whereas our own key drift leaves
        // the on-chain signer still matching signer_address, because we set it.
        const isServingUntrusted =
          productionTrust === "untrusted" &&
          currentDbStatus === RpRegistrationStatus.Registered;

        // Throttled either way: this is a hot polling endpoint (pending statuses
        // cache for 1s), so an unresolved mismatch would emit thousands of
        // identical lines. One per rp_id per window keeps it a triage signal
        // instead of log spam.
        if (await shouldLogSignerMismatch(rpId)) {
          const details = {
            rpId,
            trust: productionTrust,
            mode: dbRecord.mode,
            dbStatus: currentDbStatus,
            expectedManager,
            onChainManager: onChainRp.manager,
            expectedSigner: dbRecord.signer_address,
            onChainSigner: onChainRp.signer,
          };

          if (isServingUntrusted) {
            logger.error(
              "Registered RP is not Portal-owned on-chain; still serving stored status",
              details,
            );
          } else {
            logger.warn(
              "On-chain RP is not provably Portal-owned; preserving DB status",
              details,
            );
          }
        }
      }
    } else {
      // Not initialized on-chain — use DB status (tracks production)
      productionStatus = currentDbStatus;
    }
  } catch (error) {
    logger.error("Failed to fetch RP from production contract", {
      rpId,
      error,
    });
    return errorResponse({
      statusCode: 500,
      code: "rpc_error",
      detail: "Failed to fetch on-chain RP status.",
      attribute: null,
      req,
    });
  }

  // Fetch staging on-chain state (if configured)
  let stagingStatus: string | null = null;
  let stagingInitialized = false;
  let stagingRpcSucceeded = false;
  // How far to trust the on-chain staging reading — see evaluateOnChainTrust.
  // Preserves the DB staging_status during/after a signer rotation or a foreign
  // takeover.
  let stagingTrust: OnChainTrust = "unknown";
  if (stagingContractAddress) {
    try {
      const stagingOnChainRp = await getRpFromContract(
        numericRpId,
        stagingContractAddress,
      );
      stagingRpcSucceeded = true;
      stagingInitialized = stagingOnChainRp.initialized;

      if (stagingOnChainRp.initialized) {
        stagingTrust = evaluateOnChainTrust({
          mode: dbRecord.mode,
          onChainManager: stagingOnChainRp.manager,
          onChainSigner: stagingOnChainRp.signer,
          expectedSigner: dbRecord.signer_address,
          expectedManager,
        });

        const onChainMappedStatus = mapOnChainToDbStatus(
          stagingOnChainRp.initialized,
          stagingOnChainRp.active,
        );
        stagingStatus =
          stagingTrust === "trusted"
            ? onChainMappedStatus
            : currentDbStagingStatus ?? onChainMappedStatus;
      } else {
        stagingStatus = RpRegistrationStatus.Pending;
      }
    } catch (error) {
      logger.error("Failed to fetch RP from staging contract", {
        rpId,
        error,
      });
      // Staging failure is non-fatal; report as failed
      stagingStatus = RpRegistrationStatus.Failed;
    }
  }

  const ageMs = Date.now() - new Date(dbRecord.created_at).getTime();
  const isPastGracePeriod = ageMs > PENDING_TIMEOUT_MS;
  // updated_at-based grace windows. updated_at is bumped by a fresh retry or an
  // in-flight signer rotation, so both restart these clocks.
  const updatedAgeMs = Date.now() - new Date(dbRecord.updated_at).getTime();
  //  - staging timeout: same short grace as production.
  const isPastGracePeriodSinceUpdate = updatedAgeMs > PENDING_TIMEOUT_MS;
  //  - untrusted-initialized production timeout: a managed registration/rotation
  //    UserOp stays includable on-chain for USER_OP_MAX_VALIDITY_MS, so an
  //    unsettled op is only provably dead once that window plus the settlement
  //    margin has elapsed. Failing sooner would race a rotation that can still
  //    land, then cache `failed` for an hour over a trusted `registered`.
  const isPastUserOpValidityWindow =
    updatedAgeMs > USER_OP_MAX_VALIDITY_MS + PENDING_TIMEOUT_MS;

  // Sync DB status based on production contract only (never for deleted apps —
  // see isAppDeleted above). Only when the on-chain reading is trusted (manager
  // and signer are ours, or self-managed with no expected signer) — otherwise a
  // foreign on-chain register() would clobber the row into `registered`.
  if (
    !isAppDeleted &&
    productionInitialized &&
    productionTrust === "trusted" &&
    productionStatus !== currentDbStatus
  ) {
    try {
      await getUpdateRpStatusSdk(client).UpdateRpStatus({
        rp_id: rpId,
        status: productionStatus,
      });
      logger.info("Updated RP status in DB", {
        rpId,
        oldStatus: currentDbStatus,
        newStatus: productionStatus,
      });
    } catch (error) {
      logger.error("Failed to update RP status in DB", { rpId, error });
    }
  }

  // Sync staging status to DB when on-chain state differs. Only when we
  // can trust on-chain (manager and signer are ours, or self-managed with no DB
  // signer to compare against) — otherwise the on-chain "registered" reading
  // would clobber a legit "pending"/"failed" that rotate-signer-key or
  // rp-retry persisted while a rotation is in flight or after a failure.
  if (
    !isAppDeleted &&
    stagingRpcSucceeded &&
    stagingInitialized &&
    stagingTrust === "trusted" &&
    stagingStatus &&
    stagingStatus !== currentDbStagingStatus
  ) {
    try {
      await getUpdateStagingStatusSdk(client).UpdateStagingStatus({
        rp_id: rpId,
        staging_status: stagingStatus,
      });
      logger.info("Updated staging status in DB", {
        rpId,
        oldStatus: currentDbStagingStatus,
        newStatus: stagingStatus,
      });
    } catch (error) {
      logger.error("Failed to update staging status in DB", { rpId, error });
    }
  }

  // Timeout: if a managed RP is NOT initialized on-chain and DB status is still
  // pending after 5 minutes, transition to failed so the user sees a retry button.
  // Self-managed RPs intentionally stay pending until the developer completes
  // on-chain setup manually, so we skip the timeout for those.
  if (
    !isAppDeleted &&
    !productionInitialized &&
    currentDbStatus === RpRegistrationStatus.Pending &&
    isPastGracePeriod &&
    dbRecord.mode === "managed"
  ) {
    logger.warn("RP registration pending timeout — transitioning to failed", {
      rpId,
      createdAt: dbRecord.created_at,
      ageMs,
      operation_hash: dbRecord.operation_hash ?? "null",
    });

    try {
      await getUpdateRpStatusSdk(client).UpdateRpStatus({
        rp_id: rpId,
        status: RpRegistrationStatus.Failed,
      });

      productionStatus = RpRegistrationStatus.Failed;
    } catch (error) {
      logger.error("Failed to update timed-out RP status in DB", {
        rpId,
        error,
      });
    }
  }

  // Timeout: a managed RP that is initialized on-chain by a manager/signer pair
  // the Portal doesn't own can never become a trusted `registered` — either a
  // foreign party won the permissionless on-chain register() for this rp_id, or
  // a signer rotation never settled. The `!productionInitialized` guard above
  // can't catch this (it IS initialized), so without this the row is wedged in
  // `pending` forever, polling endlessly and never exposing the retry path. Only
  // fail it once the UserOp validity window has elapsed: before that an in-flight
  // signer rotation could still land, and failing early would cache `failed` for
  // an hour over what then becomes a trusted `registered`.
  //
  // `unknown` is normally excluded: it means we could not resolve our own
  // manager address (a KMS outage), which is not evidence of a takeover, and
  // failing healthy registrations because our own dependency is down would turn a
  // KMS blip into a self-inflicted incident.
  //
  // The exception is a managed row with no `manager_kms_key_id` at all. That is
  // not an outage, it is a durable data defect: submitManagedRpRegistration
  // deliberately keeps the claimed row when the DB write after a successful
  // on-chain submission throws, which leaves a Portal-owned registration with no
  // recorded manager key. Such a row can never resolve to `trusted`, so treating
  // it as transient would wedge it in `pending` forever — before the trust gate
  // existed it was promoted on `initialized && active` alone and healed itself.
  // Fail it so the UI stops polling and surfaces the state.
  //
  // NOTE: rp-retry also rejects rows without a manager key, so the retry button
  // on such a row reports a clear error rather than recovering. Fully fixing that
  // means persisting manager_kms_key_id BEFORE the on-chain submission, which
  // needs a new mutation (UpdateRpRegistration requires a non-null
  // operation_hash) and therefore a codegen run.
  const isUnrecoverableMissingManagerKey =
    productionTrust === "unknown" &&
    dbRecord.mode === "managed" &&
    !dbRecord.manager_kms_key_id;

  if (
    !isAppDeleted &&
    productionInitialized &&
    (productionTrust === "untrusted" || isUnrecoverableMissingManagerKey) &&
    currentDbStatus === RpRegistrationStatus.Pending &&
    isPastUserOpValidityWindow &&
    dbRecord.mode === "managed"
  ) {
    if (isUnrecoverableMissingManagerKey) {
      // Alertable: a registration we paid for on-chain that the Portal can no
      // longer manage, because the manager key was never recorded.
      logger.error(
        "Managed RP is initialized on-chain but has no manager key recorded",
        {
          rpId,
          updatedAt: dbRecord.updated_at,
          operation_hash: dbRecord.operation_hash ?? "null",
        },
      );
    }

    logger.warn(
      "RP untrusted-initialized past grace — transitioning to failed",
      {
        rpId,
        trust: productionTrust,
        updatedAt: dbRecord.updated_at,
        operation_hash: dbRecord.operation_hash ?? "null",
      },
    );

    try {
      await getUpdateRpStatusSdk(client).UpdateRpStatus({
        rp_id: rpId,
        status: RpRegistrationStatus.Failed,
      });
      productionStatus = RpRegistrationStatus.Failed;
    } catch (error) {
      logger.error("Failed to update untrusted-initialized RP status in DB", {
        rpId,
        error,
      });
    }
  }

  // Staging timeout: if staging is not initialized after the grace period,
  // transition to failed so the user gets a retry button and polling stops.
  // Only apply when the RPC call succeeded — a transient RPC failure should
  // not permanently mark a healthy staging registration as failed.
  // Uses the updated_at clock so a fresh staging retry resets the grace period.
  if (
    !isAppDeleted &&
    stagingContractAddress &&
    stagingRpcSucceeded &&
    !stagingInitialized &&
    isPastGracePeriodSinceUpdate &&
    dbRecord.mode === "managed"
  ) {
    stagingStatus = RpRegistrationStatus.Failed;

    if (currentDbStagingStatus !== RpRegistrationStatus.Failed) {
      try {
        await getUpdateStagingStatusSdk(client).UpdateStagingStatus({
          rp_id: rpId,
          staging_status: RpRegistrationStatus.Failed,
        });
      } catch (error) {
        logger.error("Failed to update staging timeout status in DB", {
          rpId,
          error,
        });
      }
    }
  }

  const result: DualStatus = {
    production_status: productionStatus,
    staging_status: stagingStatus,
  };

  if (redis) {
    try {
      // Use a minimal TTL for pending statuses so polling picks up on-chain changes quickly
      const ttl =
        productionStatus === "pending" || stagingStatus === "pending"
          ? 1
          : CACHE_TTL_SECONDS;
      const cacheKey = `${CACHE_KEY_PREFIX}${rpId}`;
      await redis.set(cacheKey, JSON.stringify(result), "EX", ttl);
    } catch (error) {
      logger.warn("Failed to write to cache", { rpId, error });
    }
  }

  return NextResponse.json(result, { status: 200 });
}
