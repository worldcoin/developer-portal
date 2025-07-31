import type { FullProof } from '@semaphore-protocol/proof';
import { groth16 } from 'snarkjs';
import { unpackProof } from './unpack-proof';
import * as verificationKeys from './verification-key.json';

/**
 * Verifies a Semaphore proof.
 * @param fullProof The SnarkJS Semaphore proof.
 * @param treeDepth The Merkle tree depth.
 * @returns True if the proof is valid, false otherwise.
 */
export const verifySemaphoreProof = ({
  merkleTreeRoot,
  nullifierHash,
  externalNullifier,
  signal,
  proof,
}: FullProof): Promise<boolean> => {
  return groth16.verify(
    verificationKeys,
    [merkleTreeRoot, nullifierHash, signal, externalNullifier],
    unpackProof(proof),
  );
};
