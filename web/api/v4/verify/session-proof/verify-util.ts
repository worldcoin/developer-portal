import { logger } from "../../../../lib/logger";
import { verifySessionProofOnChain } from "../../../helpers/temporal-rpc";
import { SessionProofRequest } from "../request-schema";
import { getSessionCommitment } from "@worldcoin/idkit-server";

export interface SessionResult {
  identifier: string;
  sessionId: string;
  success: boolean;
  nullifier?: string;
  code?: string;
  detail?: string;
}

export function getVerifierSessionId(sessionId: string): bigint {
  if (sessionId.startsWith("session_")) {
    return getSessionCommitment(sessionId);
  }

  return BigInt(sessionId);
}

export async function processSessionProof(
  rpId: bigint,
  sessionProofRequest: SessionProofRequest,
  verifierAddress: string,
): Promise<SessionResult[]> {
  const sessionResults = await Promise.all(
    sessionProofRequest.responses.map(async (item): Promise<SessionResult> => {
      try {
        const verifyResult = await verifySessionProofOnChain(
          {
            rpId: rpId,
            nonce: BigInt(sessionProofRequest.nonce),
            signalHash: BigInt(item.signal_hash),
            expiresAtMin: BigInt(item.expires_at_min),
            issuerSchemaId: BigInt(item.issuer_schema_id),
            credentialGenesisIssuedAtMin: BigInt(
              item.credential_genesis_issued_at_min || "0",
            ),
            sessionId: getVerifierSessionId(sessionProofRequest.session_id),
            sessionNullifier: [
              BigInt(item.session_nullifier[0]),
              BigInt(item.session_nullifier[1]),
            ],
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
            sessionId: sessionProofRequest.session_id,
            success: false,
            // Defaulting to "generic_error" for backwards compatibility.
            code: verifyResult.error?.code || "generic_error",
            detail:
              verifyResult.error?.detail ||
              "There was an error verifying this session proof.",
          };
        }

        // For session proofs, use session_nullifier[0] as the nullifier for deduplication
        return {
          identifier: item.identifier,
          sessionId: sessionProofRequest.session_id,
          success: true,
          nullifier: item.session_nullifier[0],
        };
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        // Reaching this catch means a per-item input could not be processed
        // (e.g. a malformed client-supplied field that fails BigInt conversion).
        // On-chain verifier reverts are handled gracefully by
        // verifySessionProofOnChain (returns success:false) and never throw
        // here. This is client-driven bad input that yields a 400, so log at
        // warn to avoid polluting the error rate.
        logger.warn("Error verifying v4 session proof", {
          error: errorMessage,
          rpId,
          identifier: item.identifier,
          sessionId: sessionProofRequest.session_id,
        });
        return {
          identifier: item.identifier,
          sessionId: sessionProofRequest.session_id,
          success: false,
          code: "verification_error",
          detail: errorMessage,
        };
      }
    }),
  );

  return sessionResults;
}
