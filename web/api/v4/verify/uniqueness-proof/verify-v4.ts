import { hashActionToUint256 } from "@/api/helpers/rp-utils";
import { verifyProofOnChain } from "@/api/helpers/temporal-rpc";
import { logger } from "@/lib/logger";
import { AppErrorCodes } from "@worldcoin/idkit-core";
import { nullifierHashToBigIntStr } from "../../../helpers/verify";
import { UniquenessProofResponseV4 } from "../request-schema";
import { UniquenessResult } from "./handler";

/**
 * Processes World ID 4.0 uniqueness proofs by verifying them on-chain via the Verifier contract.
 * Verifies proofs in parallel and returns results for each response item.
 */
export async function processUniquenessProofV4(
  rpId: bigint,
  nonce: string,
  action: string,
  responses: UniquenessProofResponseV4[],
  verifierAddress: string,
): Promise<UniquenessResult[]> {
  const results = await Promise.all(
    responses.map(async (item): Promise<UniquenessResult> => {
      try {
        const verifyResult = await verifyProofOnChain(
          {
            nullifier: BigInt(item.nullifier),
            action: hashActionToUint256(action),
            rpId,
            nonce: BigInt(nonce),
            signalHash: BigInt(item.signal_hash),
            expiresAtMin: BigInt(item.expires_at_min),
            issuerSchemaId: BigInt(item.issuer_schema_id),
            credentialGenesisIssuedAtMin: BigInt(
              item.credential_genesis_issued_at_min || "0",
            ),
            zeroKnowledgeProof: item.proof.map((p) => BigInt(p)) as [
              bigint,
              bigint,
              bigint,
              bigint,
              bigint,
            ],
          },
          verifierAddress,
        );

        if (!verifyResult.success) {
          return {
            identifier: item.identifier,
            success: false,
            code: verifyResult.error?.code || AppErrorCodes.GenericError,
            detail:
              verifyResult.error?.detail ||
              "There was an error verifying this proof.",
          };
        }

        return {
          identifier: item.identifier,
          success: true,
          // Normalize nullifier for storage
          nullifier: nullifierHashToBigIntStr(item.nullifier),
        };
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.error("Error verifying v4 proof", {
          error: errorMessage,
          rpId: rpId.toString(),
          identifier: item.identifier,
        });
        return {
          identifier: item.identifier,
          success: false,
          code: "verification_error",
          detail: errorMessage,
        };
      }
    }),
  );

  return results;
}
