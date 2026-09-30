import { prepareRpManagerKey } from "@/api/helpers/rp-registration-preparation";
import { getSdk as getRegistrationSdk } from "@/api/hasura/rp-retry/graphql/get-rp-registration.generated";
import { getKMSClient } from "@/api/helpers/kms";
import { getEthAddressFromKMS } from "@/api/helpers/kms-eth";
import {
  submitRegisterRpTransaction,
  submitRotateSignerTransaction,
} from "@/api/helpers/rp-transactions";
import {
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
  normalizeAddress,
  parseRpId,
} from "@/api/helpers/rp-utils";
import { getRpFromContract } from "@/api/helpers/temporal-rpc";
import { getSdk as getUpdateProductionRetrySdk } from "@/api/hasura/rp-retry/graphql/update-production-retry.generated";
import { getSdk as getUpdateStagingRetrySdk } from "@/api/hasura/rp-retry/graphql/update-staging-retry.generated";
import type { GetRpRegistrationForRetryQuery } from "@/api/hasura/rp-retry/graphql/get-rp-registration.generated";
import { logger } from "@/lib/logger";
import type { KMSClient } from "@aws-sdk/client-kms";
import type { GraphQLClient } from "graphql-request";

export type RpRetryEnvironment = "production" | "staging";

export type RpRetryResult =
  | { ok: true; environment: RpRetryEnvironment; operationHash: string | null }
  | {
      ok: false;
      code:
        | "environment_not_configured"
        | "not_managed"
        | "missing_signer"
        | "kms_error"
        | "rpc_error"
        | "rp_id_taken"
        | "submission_error"
        | "db_error"
        | "recovery_not_available";
      detail: string;
    };

/** Caller must authorize access to this registration before retrying it. */
export async function retryRpRegistration({
  client,
  registration: dbRecord,
  environment,
}: {
  client: GraphQLClient;
  registration: NonNullable<
    GetRpRegistrationForRetryQuery["rp_registration_by_pk"]
  >;
  environment: RpRetryEnvironment;
}): Promise<RpRetryResult> {
  let registration = dbRecord;
  if (registration.mode === "managed" && !registration.manager_kms_key_id) {
    try {
      const { rp_registration_by_pk: fresh } = await getRegistrationSdk(
        client,
      ).GetRpRegistrationForRetry({ rp_id: dbRecord.rp_id });
      if (
        !fresh ||
        fresh.app_id !== dbRecord.app_id ||
        fresh.app.team_id !== dbRecord.app.team_id
      ) {
        return {
          ok: false,
          code: "recovery_not_available",
          detail: "Registration changed. Reload its status before retrying.",
        };
      }
      registration = fresh;
    } catch (error) {
      logger.error("Failed to reread registration for manager key recovery", {
        error,
        rpId: dbRecord.rp_id,
      });
      return {
        ok: false,
        code: "db_error",
        detail: "Failed to read registration for recovery.",
      };
    }
  }
  const rpId = registration.rp_id;
  const appId = registration.app_id;
  const teamId = registration.app.team_id;
  const config =
    environment === "production"
      ? getRpRegistryConfig()
      : getStagingRpRegistryConfig();
  if (!config) {
    return {
      ok: false,
      code: "environment_not_configured",
      detail: `The ${environment} contract is not configured.`,
    };
  }
  if (registration.mode !== "managed") {
    return {
      ok: false,
      detail: "Retry is only available for managed mode RPs.",
      code: "not_managed",
    };
  }

  let managerKmsKeyId = registration.manager_kms_key_id;
  const signerAddress = registration.signer_address;

  if (!signerAddress) {
    return {
      ok: false,
      detail: "Signer address is missing for this managed RP.",
      code: "missing_signer",
    };
  }

  if (!managerKmsKeyId) {
    if (
      environment !== "production" ||
      registration.status !== "failed" ||
      registration.operation_hash ||
      registration.staging_operation_hash
    ) {
      logger.warn(
        "Manager key recovery is not available for this registration",
        { rpId, appId, environment },
      );
      return {
        ok: false,
        code: "recovery_not_available",
        detail:
          "Manager key recovery requires a failed production registration with no submitted operation. Contact support.",
      };
    }
    try {
      const onChain = await getRpFromContract(
        parseRpId(rpId),
        config.contractAddress,
      );
      if (onChain.initialized) {
        logger.warn(
          "Cannot recover a missing manager key for an initialized RP",
          { rpId, appId },
        );
        return {
          ok: false,
          code: "recovery_not_available",
          detail:
            "RP is already registered on-chain but its manager key is missing. Contact support.",
        };
      }
    } catch (error) {
      logger.error("Failed to check contract before manager key recovery", {
        error,
        rpId,
        appId,
      });
      return {
        ok: false,
        code: "rpc_error",
        detail: "Failed to check on-chain registration before recovery.",
      };
    }
    let prepared;
    try {
      prepared = await prepareRpManagerKey({
        client,
        kmsClient: await getKMSClient(config.kmsRegion),
        kmsRegion: config.kmsRegion,
        rpIdString: rpId,
        appId,
      });
    } catch (error) {
      logger.error("Failed to initialize manager key recovery", {
        error,
        rpId,
        appId,
      });
      return {
        ok: false,
        code: "kms_error",
        detail: "Failed to initialize manager key recovery.",
      };
    }
    if (!prepared.ok) return prepared;
    managerKmsKeyId = prepared.managerKmsKeyId;
    logger.info("Recovered manager key for incomplete RP registration", {
      rpId,
      appId,
    });
  }

  const appName = registration.app?.app_metadata?.[0]?.name || "";
  const numericRpId = parseRpId(rpId);

  let kmsClient: KMSClient;
  let managerAddress: string;
  try {
    kmsClient = await getKMSClient(config.kmsRegion);
    managerAddress = await getEthAddressFromKMS(
      kmsClient,
      managerKmsKeyId,
      config.kmsRegion,
    );
  } catch (error) {
    logger.error("Failed to derive manager address from KMS key", {
      rpId,
      appId,
      teamId,
      error,
    });
    return {
      ok: false,
      detail: "Failed to derive manager address.",
      code: "kms_error",
    };
  }

  let onChainRp;
  try {
    onChainRp = await getRpFromContract(numericRpId, config.contractAddress);
  } catch (error) {
    logger.error("Failed to fetch RP from contract", {
      rpId,
      appId,
      teamId,
      environment,
      error,
    });
    return {
      ok: false,
      detail: "Failed to fetch on-chain RP status.",
      code: "rpc_error",
    };
  }

  // Registration is permissionless: a disclosed ID may be claimed by another
  // manager. Our key cannot update that RP, so retry must stop here.
  if (
    onChainRp.initialized &&
    normalizeAddress(onChainRp.manager).toLowerCase() !==
      normalizeAddress(managerAddress).toLowerCase()
  ) {
    logger.warn("Retry: rp_id is managed on-chain by a foreign manager", {
      rpId,
      appId,
      teamId,
      environment,
      expectedManager: managerAddress,
      onChainManager: onChainRp.manager,
    });
    return {
      ok: false,
      detail:
        "This app's RP is controlled on-chain by a different manager, so Portal cannot update it. Contact support.",
      code: "rp_id_taken",
    };
  }

  let operationHash: string | undefined;

  if (!onChainRp.initialized) {
    try {
      operationHash = await submitRegisterRpTransaction(config, {
        rpId: numericRpId,
        managerAddress,
        signerAddress,
        appName,
        kmsClient,
      });

      logger.info("Retry: registerRp submitted", {
        rpId,
        appId,
        teamId,
        environment,
        operationHash,
      });
    } catch (error) {
      logger.error("Retry: failed to submit registerRp", {
        rpId,
        appId,
        teamId,
        environment,
        error,
      });
      return {
        ok: false,
        detail: "Failed to submit registration transaction.",
        code: "submission_error",
      };
    }
  } else if (
    normalizeAddress(onChainRp.signer).toLowerCase() !==
    normalizeAddress(signerAddress).toLowerCase()
  ) {
    try {
      operationHash = await submitRotateSignerTransaction(config, {
        rpId: numericRpId,
        newSignerAddress: signerAddress,
        managerKmsKeyId,
        kmsClient,
      });

      logger.info("Retry: updateRp (signer rotation) submitted", {
        rpId,
        appId,
        teamId,
        environment,
        operationHash,
      });
    } catch (error) {
      logger.error("Retry: failed to submit updateRp", {
        rpId,
        appId,
        teamId,
        environment,
        error,
      });
      return {
        ok: false,
        detail: "Failed to submit signer update transaction.",
        code: "submission_error",
      };
    }
  } else {
    logger.info("Retry: RP already in sync on-chain", {
      rpId,
      appId,
      teamId,
      environment,
    });
  }

  // Persist operation hash and reset status to pending on retry
  if (operationHash) {
    try {
      if (environment === "production") {
        await getUpdateProductionRetrySdk(client).UpdateProductionRetry({
          rp_id: rpId,
          operation_hash: operationHash,
          status: "pending",
        });
      } else {
        await getUpdateStagingRetrySdk(client).UpdateStagingRetry({
          rp_id: rpId,
          staging_operation_hash: operationHash,
          staging_status: "pending",
        });
      }
    } catch (error) {
      logger.error("Failed to update retry state in DB", {
        rpId,
        appId,
        teamId,
        environment,
        error,
      });
    }
  }

  const redis = global.RedisClient;
  if (redis) {
    try {
      const cacheKey = `rp_status:v2:${rpId}`;
      await redis.del(cacheKey);
    } catch (error) {
      logger.warn("Failed to clear cache", { rpId, appId, teamId, error });
    }
  }

  return { ok: true, environment, operationHash: operationHash ?? null };
}
