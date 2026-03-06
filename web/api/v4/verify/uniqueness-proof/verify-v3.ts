import { verifyProof } from "@/api/helpers/verify";
import { generateExternalNullifier } from "@/lib/hashing";
import { LegacyVerificationLevel } from "@/lib/idkit";
import { logger } from "@/lib/logger";
import { IDKitErrorCodes } from "@worldcoin/idkit";
import { UniquenessProofResponseV3 } from "../request-schema";
import { UniquenessResult } from "./handler";

/**
 * Processes World ID 3.0 uniqueness proofs by verifying them via the sequencer (cloud-based).
 * Verifies proofs in parallel and returns results for each response item.
 */
export async function processUniquenessProofV3(
  appId: string,
  action: string,
  responses: UniquenessProofResponseV3[],
  isStaging: boolean,
): Promise<UniquenessResult[]> {
  const externalNullifier = generateExternalNullifier(appId, action).digest;

  const results = await Promise.all(
    responses.map(async (item): Promise<UniquenessResult> => {
      try {
        const { error, success } = await verifyProof(
          {
            signal_hash: item.signal_hash,
            proof: item.proof,
            merkle_root: item.merkle_root,
            nullifier_hash: item.nullifier,
            external_nullifier: externalNullifier,
          },
          {
            is_staging: isStaging,
            // identifier uses VerificationLevel values (legacy term for credential type)
            verification_level: item.identifier as LegacyVerificationLevel,
            max_age: item.max_age,
          },
        );

        if (error || !success) {
          return {
            identifier: item.identifier,
            success: false,
            code: error?.code || IDKitErrorCodes.GenericError,
            detail:
              error?.message || "There was an error verifying this proof.",
            attribute: error?.attribute || undefined,
          };
        }

        return {
          identifier: item.identifier,
          success: true,
          nullifier: item.nullifier,
        };
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.error("Error verifying v3 proof", {
          error: errorMessage,
          appId,
          identifier: item.identifier,
        });
        return {
          identifier: item.identifier,
          success: false,
          code: "verification_error",
          detail: errorMessage,
          attribute: undefined,
        };
      }
    }),
  );

  return results;
}
