import { scheduleKeyDeletion } from "@/api/helpers/kms";
import { getEthAddressFromKMS } from "@/api/helpers/kms-eth";
import { resolveManagerKeyForRegistration } from "@/api/helpers/rp-manager-key-migration";
import { getSdk as getPrepareSdk } from "@/api/hasura/register-rp/graphql/prepare-rp-registration.generated";
import { getSdk as getRegistrationSdk } from "@/api/hasura/rp-retry/graphql/get-rp-registration.generated";
import { logger } from "@/lib/logger";
import type { KMSClient } from "@aws-sdk/client-kms";
import type { GraphQLClient } from "graphql-request";

/** Both initial registration and recovery must adopt the key saved by the DB. */
export async function prepareRpManagerKey({
  client,
  kmsClient,
  kmsRegion,
  rpIdString,
  appId,
}: {
  client: GraphQLClient;
  kmsClient: KMSClient;
  kmsRegion: string;
  rpIdString: string;
  appId: string;
}) {
  const candidate = await resolveManagerKeyForRegistration({
    kmsClient,
    kmsRegion,
    rpIdString,
    appId,
  });
  if (!candidate.ok) return candidate;

  try {
    const result = await getPrepareSdk(client).PrepareRpRegistration({
      rp_id: rpIdString,
      app_id: appId,
      manager_kms_key_id: candidate.managerKmsKeyId,
      is_unique_manager_key: candidate.isUniqueManagerKey,
    });
    if (result.update_rp_registration?.affected_rows === 1) return candidate;

    const { rp_registration_by_pk: saved } = await getRegistrationSdk(
      client,
    ).GetRpRegistrationForRetry({ rp_id: rpIdString });
    if (
      !saved ||
      saved.app_id !== appId ||
      saved.mode !== "managed" ||
      !saved.manager_kms_key_id
    ) {
      throw new Error("Manager key preparation did not find a saved key");
    }

    if (
      candidate.isUniqueManagerKey &&
      candidate.managerKmsKeyId !== saved.manager_kms_key_id
    ) {
      try {
        await scheduleKeyDeletion(kmsClient, candidate.managerKmsKeyId);
      } catch (error) {
        logger.warn(
          "Failed to delete unused manager key after competing preparation",
          {
            error,
            app_id: appId,
            rpIdString,
          },
        );
      }
    }

    try {
      return {
        ok: true as const,
        managerKmsKeyId: saved.manager_kms_key_id,
        isUniqueManagerKey: saved.is_unique_manager_key,
        managerAddress: await getEthAddressFromKMS(
          kmsClient,
          saved.manager_kms_key_id,
          kmsRegion,
        ),
      };
    } catch (error) {
      logger.error(
        "Failed to derive the saved manager address after competing preparation",
        {
          error,
          app_id: appId,
          rpIdString,
        },
      );
      return {
        ok: false as const,
        code: "kms_error" as const,
        detail:
          "Failed to derive the saved manager address. Retry registration.",
        retained: true,
      };
    }
  } catch (error) {
    // A timed-out mutation may have saved the candidate. Keep both row and key.
    logger.error(
      "Manager key preparation could not be confirmed; retaining state",
      {
        error,
        app_id: appId,
        rpIdString,
      },
    );
    return {
      ok: false as const,
      code: "db_error" as const,
      detail:
        "Manager key preparation could not be confirmed. Retry registration.",
    };
  }
}
