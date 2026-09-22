import "server-only";

import { getSdk as getClaimRpSdk } from "@/api/hasura/register-rp/graphql/claim-rp-registration.generated";
import { getKMSClient } from "@/api/helpers/kms";
import {
  BackfillRow,
  finalizeRpBackfill,
  Registry,
  RP_RESERVATION_SIGNER,
  rpSetupPaused,
} from "@/api/helpers/rp-id-backfill";
import { resolveManagerAddress } from "@/api/helpers/rp-manager";
import type { ManagedRegistrationResult } from "@/api/helpers/rp-registration-flows";
import {
  submitRegisterRpTransaction,
  submitRotateSignerTransaction,
} from "@/api/helpers/rp-transactions";
import {
  evaluateOnChainTrust,
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
  mapOnChainToDbStatus,
  parseRpId,
  RpRegistryConfig,
  RpRegistrationStatus,
} from "@/api/helpers/rp-utils";
import {
  getRpFromContract,
  getUserOperationReceipt,
  OnChainRelyingParty,
} from "@/api/helpers/temporal-rpc";
import { logger } from "@/lib/logger";
import { gql, GraphQLClient } from "graphql-request";

type ActivationRegistration = {
  rp_id: string;
  app_id: string;
  signer_address: string;
  manager_kms_key_id: string;
};

/** Persist each registry independently. A hash is saved before its operation can escape. */
async function writeAttempt(
  client: GraphQLClient,
  rpId: string,
  registry: Registry,
  status: string,
  hash: string | null,
  expected?: { status: string | null; hash: string | null },
) {
  const statusColumn = registry === "production" ? "status" : "staging_status";
  const hashColumn =
    registry === "production" ? "operation_hash" : "staging_operation_hash";
  const result = await client.request<{
    update_rp_registration: { affected_rows: number };
  }>(
    gql`
    mutation SaveRpActivation($rp_id: String!, $status: rp_registration_status!, $hash: String, $expected: rp_registration_bool_exp! = {}) {
      update_rp_registration(where: { rp_id: { _eq: $rp_id }, app: { deleted_at: { _is_null: true } }, _and: [$expected] }
        _set: { ${statusColumn}: $status, ${hashColumn}: $hash }) { affected_rows }
    }
  `,
    {
      rp_id: rpId,
      status,
      hash,
      expected: expected
        ? {
            [statusColumn]:
              expected.status === null
                ? { _is_null: true }
                : { _eq: expected.status },
            [hashColumn]:
              expected.hash === null
                ? { _is_null: true }
                : { _eq: expected.hash },
          }
        : {},
    },
  );
  if (result.update_rp_registration.affected_rows !== 1 && !expected)
    throw new Error("Activation app disappeared or was deleted");
  return result.update_rp_registration.affected_rows === 1;
}

export async function submitRpActivation(
  client: GraphQLClient,
  registration: ActivationRegistration,
  backfill: BackfillRow,
  registry: Registry,
  config: RpRegistryConfig,
  manager: string,
  appName: string,
) {
  let hash: string | null = null;
  let trackingFailed = false;
  try {
    const rp = await getRpFromContract(
      parseRpId(registration.rp_id),
      config.contractAddress,
    );
    const isReserved = backfill[`${registry}_status`] === "reserved";
    if (
      isReserved &&
      (!rp.initialized ||
        rp.manager.toLowerCase() !== manager.toLowerCase() ||
        ![RP_RESERVATION_SIGNER, registration.signer_address].some(
          (signer) => signer.toLowerCase() === rp.signer.toLowerCase(),
        ))
    ) {
      throw new Error(
        "Reserved RP manager or signer does not match; contact support",
      );
    }
    if (
      rp.initialized &&
      evaluateOnChainTrust({
        mode: "managed",
        onChainManager: rp.manager,
        onChainSigner: rp.signer,
        expectedManager: manager,
        expectedSigner: registration.signer_address,
      }) === "trusted"
    ) {
      const status = mapOnChainToDbStatus(true, rp.active);
      await writeAttempt(client, registration.rp_id, registry, status, null);
      await finalizeRpBackfill(client, registration.app_id, registry);
      return { hash, status };
    }
    if (rp.initialized && !isReserved)
      throw new Error("RP ID is already claimed; contact support");
    const kmsClient = await getKMSClient(config.kmsRegion);
    const beforeSend = async (requestId: string) => {
      // A failed tracking write must stop both registries, not be treated as a chain failure.
      try {
        await writeAttempt(
          client,
          registration.rp_id,
          registry,
          "pending",
          requestId,
        );
      } catch (error) {
        trackingFailed = true;
        throw error;
      }
      hash = requestId;
    };
    if (isReserved) {
      await submitRotateSignerTransaction(config, {
        rpId: parseRpId(registration.rp_id),
        newSignerAddress: registration.signer_address,
        managerKmsKeyId: registration.manager_kms_key_id,
        kmsClient,
        beforeSend,
      });
    } else {
      await submitRegisterRpTransaction(config, {
        rpId: parseRpId(registration.rp_id),
        managerAddress: manager,
        signerAddress: registration.signer_address,
        appName,
        kmsClient,
        beforeSend,
      });
    }
    return { hash, status: RpRegistrationStatus.Pending };
  } catch (error) {
    if (trackingFailed) throw error;
    logger.warn("RP activation attempt did not complete", {
      rpId: registration.rp_id,
      registry,
      hash,
      error,
    });
    // A prepared request may have been accepted. Never discard or fail it on transport error.
    if (hash) return { hash, status: RpRegistrationStatus.Pending };
    await writeAttempt(client, registration.rp_id, registry, "failed", null);
    return { hash, status: RpRegistrationStatus.Failed };
  }
}

export async function activateReservedRp(
  client: GraphQLClient,
  backfill: BackfillRow,
  signerAddress: string,
  appName: string,
): Promise<ManagedRegistrationResult> {
  const production = getRpRegistryConfig();
  const staging = getStagingRpRegistryConfig();
  const managerKeyId = process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID?.trim();
  if (!production || !staging || !managerKeyId)
    return {
      ok: false,
      code: "config_error",
      detail:
        "Both registries and the shared manager key are required for activation.",
    };
  const manager = await resolveManagerAddress(
    managerKeyId,
    production.kmsRegion,
  );
  if (!manager)
    return {
      ok: false,
      code: "kms_error",
      detail: "Could not resolve the shared manager.",
    };
  const { insert_rp_registration_one: slot } = await getClaimRpSdk(
    client,
  ).ClaimRpRegistration({
    rp_id: backfill.rp_id,
    app_id: backfill.app_id,
    mode: "managed",
    signer_address: signerAddress,
    manager_kms_key_id: managerKeyId,
    is_unique_manager_key: false,
    staging_status: "pending",
  });
  if (!slot)
    return {
      ok: false,
      code: "already_registered",
      detail: "Registration already in progress or completed for this app.",
    };
  const registration = {
    rp_id: backfill.rp_id,
    app_id: backfill.app_id,
    signer_address: signerAddress,
    manager_kms_key_id: managerKeyId,
  };
  try {
    const primary = await submitRpActivation(
      client,
      registration,
      backfill,
      "production",
      production,
      manager,
      appName,
    );
    const secondary = await submitRpActivation(
      client,
      registration,
      backfill,
      "staging",
      staging,
      manager,
      appName,
    );
    return {
      ok: true,
      rpIdString: backfill.rp_id,
      managerAddress: manager,
      signerAddress,
      operationHash: primary.hash,
      status: primary.status,
      stagingOperationHash: secondary.hash,
      stagingStatus: secondary.status,
    };
  } catch (error) {
    logger.error("Activation tracking failed; pending registration preserved", {
      rpId: backfill.rp_id,
      error,
    });
    return {
      ok: false,
      code: "db_error",
      detail:
        "Activation tracking failed. Pending registration preserved; contact support.",
    };
  }
}

/** Failed attempts and a legacy, never-started staging registration can be retried manually. */
export async function claimRpActivationRetry(
  client: GraphQLClient,
  rpId: string,
  registry: Registry,
  productionActivated = false,
) {
  const statusColumn = registry === "production" ? "status" : "staging_status";
  const hashColumn =
    registry === "production" ? "operation_hash" : "staging_operation_hash";
  const result = await client.request<{
    update_rp_registration: { affected_rows: number };
  }>(
    gql`
    mutation ClaimRpActivationRetry($rp_id: String!, $primary: rp_registration_bool_exp! = {}) {
      update_rp_registration(where: { mode: { _eq: managed }, _and: [$primary], rp_id: { _eq: $rp_id }, _or: [{ ${statusColumn}: { _eq: failed } }, { ${statusColumn}: { _is_null: true }, ${hashColumn}: { _is_null: true } }], app: { deleted_at: { _is_null: true } } }
        _set: { ${statusColumn}: pending, ${hashColumn}: null }) { affected_rows }
    }
  `,
    {
      rp_id: rpId,
      primary:
        registry === "staging" && productionActivated
          ? { status: { _neq: "pending" } }
          : {},
    },
  );
  return result.update_rp_registration.affected_rows === 1;
}

/** Status readers must not expire an uncertain activation based on row age. */
export async function reconcileRpActivation(
  client: GraphQLClient,
  appId: string,
  registry: Registry,
  rp: OnChainRelyingParty | null,
  trusted: boolean,
  status: string | null,
  hash: string | null | undefined,
) {
  if (trusted && rp?.initialized) {
    // During the operator pass, status reads must not wait on its session lock.
    // The next ordinary status read after reopening can finalize this row.
    if (!rpSetupPaused()) await finalizeRpBackfill(client, appId, registry);
    return mapOnChainToDbStatus(true, rp.active);
  }
  if (status !== "pending" || !hash) return status;
  try {
    const receipt = await getUserOperationReceipt(hash);
    if (
      receipt?.userOpHash.toLowerCase() === hash.toLowerCase() &&
      receipt.success === false
    )
      return "failed";
  } catch (error) {
    logger.warn("Activation receipt is unresolved", {
      appId,
      registry,
      hash,
      error,
    });
  }
  return status;
}

/** Both status entry points share the same receipt-based activation reconciliation. */
export async function readRpActivationStatus(
  client: GraphQLClient,
  registration: {
    app_id: string;
    rp_id: string;
    mode: unknown;
    signer_address?: string | null;
    manager_kms_key_id?: string | null;
    status: unknown;
    staging_status?: unknown;
    operation_hash?: string | null;
    staging_operation_hash?: string | null;
  },
) {
  const manager = registration.manager_kms_key_id
    ? await resolveManagerAddress(
        registration.manager_kms_key_id,
        process.env.RP_REGISTRY_KMS_REGION,
      )
    : null;
  const result: { production_status: string; staging_status: string | null } = {
    production_status: registration.status as string,
    staging_status: (registration.staging_status as string | null) ?? null,
  };
  for (const registry of ["production", "staging"] as const) {
    const address =
      registry === "production"
        ? process.env.RP_REGISTRY_CONTRACT_ADDRESS
        : process.env.RP_REGISTRY_STAGING_CONTRACT_ADDRESS;
    if (!address) continue;
    let rp: OnChainRelyingParty | null = null;
    try {
      rp = await getRpFromContract(parseRpId(registration.rp_id), address);
    } catch (error) {
      logger.warn("Activation registry read failed; preserving status", {
        registry,
        error,
      });
    }
    const trusted =
      !!rp &&
      evaluateOnChainTrust({
        mode: registration.mode,
        onChainManager: rp.manager,
        onChainSigner: rp.signer,
        expectedSigner: registration.signer_address,
        expectedManager: manager,
      }) === "trusted";
    const hash =
      registry === "production"
        ? registration.operation_hash
        : registration.staging_operation_hash;
    const oldStatus = result[`${registry}_status`];
    const status = await reconcileRpActivation(
      client,
      registration.app_id,
      registry,
      rp,
      trusted,
      oldStatus,
      hash,
    );
    if (status && status !== oldStatus) {
      const updated = await writeAttempt(
        client,
        registration.rp_id,
        registry,
        status,
        hash ?? null,
        { status: oldStatus, hash: hash ?? null },
      );
      if (updated) result[`${registry}_status`] = status;
    }
  }
  return result;
}
