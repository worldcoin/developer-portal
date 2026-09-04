import { hashSignal } from "@worldcoin/idkit/hashing";
import type { VerifyProofParams } from "./temporal-rpc";

export function toUniquenessProofParams(
  rpId: bigint,
  nonce: string,
  action: string,
  item: {
    nullifier: string;
    signal_hash: string;
    expires_at_min: string | number;
    issuer_schema_id: string | number;
    credential_genesis_issued_at_min?: string | number;
    proof: readonly [string, string, string, string, string];
  },
): VerifyProofParams {
  return {
    nullifier: BigInt(item.nullifier),
    action: BigInt(hashSignal(action)),
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
  };
}
