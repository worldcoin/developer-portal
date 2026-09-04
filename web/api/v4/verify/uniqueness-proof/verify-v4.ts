import { verifyProofOnChain } from "@/api/helpers/temporal-rpc";
import { getTestProofVerdict } from "@/api/helpers/test-proofs";
import { toUniquenessProofParams } from "@/api/helpers/uniqueness-proof-params";
import { logger } from "@/lib/logger";
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
  environment?: string,
  onTestVerification?: () => void,
): Promise<UniquenessResult[]> {
  const results = await Promise.all(
    responses.map(async (item): Promise<UniquenessResult> => {
      try {
        const chainParams = toUniquenessProofParams(rpId, nonce, action, item);
        const testVerdict = await getTestProofVerdict({
          action,
          proofParams: chainParams,
          environment,
        });
        if (testVerdict) onTestVerification?.();
        const verifyResult =
          testVerdict ??
          (await verifyProofOnChain(chainParams, verifierAddress));

        if (!verifyResult.success) {
          return {
            identifier: item.identifier,
            success: false,
            // Defaulting to "generic_error" for backwards compatibility.
            code: verifyResult.error?.code || "generic_error",
            detail:
              verifyResult.error?.detail ||
              "There was an error verifying this proof.",
          };
        }

        return {
          identifier: item.identifier,
          success: true,
          nullifier: item.nullifier,
        };
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        // Reaching this catch means a per-item input could not be processed
        // (e.g. a malformed client-supplied field that fails BigInt conversion).
        // On-chain verifier reverts are handled gracefully by verifyProofOnChain
        // (returns success:false) and never throw here. This is client-driven
        // bad input that yields a 400, so log at warn to avoid polluting the
        // error rate.
        logger.warn("Error verifying v4 proof", {
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
