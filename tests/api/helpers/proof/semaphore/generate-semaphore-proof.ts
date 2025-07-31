import { BigNumber } from '@ethersproject/bignumber';
import { BytesLike, Hexable } from '@ethersproject/bytes';
import { Group } from '@semaphore-protocol/group';
import type { Identity } from '@semaphore-protocol/identity';
import type { FullProof, SnarkArtifacts } from '@semaphore-protocol/proof';
import { MerkleProof } from '@zk-kit/incremental-merkle-tree';
import { groth16 } from 'snarkjs';
import { packProof } from './pack-proof';

/**
 * Generates a Semaphore proof.
 * World ID overridden to avoid double hashing the external nullifier and signal hash.
 * @param identity The Semaphore identity.
 * @param groupOrMerkleProof The Semaphore group or its Merkle proof.
 * @param externalNullifier The external nullifier.
 * @param signal The Semaphore signal.
 * @param snarkArtifacts The SNARK artifacts.
 * @returns The Semaphore proof ready to be verified.
 */
export async function generateSemaphoreProof(
  { trapdoor, nullifier, commitment }: Identity,
  groupOrMerkleProof: Group | MerkleProof,
  externalNullifier: BytesLike | Hexable | number | bigint,
  signal: BytesLike | Hexable | number | bigint,
  snarkArtifacts: SnarkArtifacts,
): Promise<FullProof> {
  let merkleProof: MerkleProof;

  if ('depth' in groupOrMerkleProof) {
    const index = groupOrMerkleProof.indexOf(commitment);

    if (index === -1) {
      throw new Error('The identity is not part of the group');
    }

    merkleProof = groupOrMerkleProof.generateMerkleProof(index);
  } else {
    merkleProof = groupOrMerkleProof;
  }

  console.log(snarkArtifacts.wasmFilePath);

  const { proof, publicSignals } = await groth16.fullProve(
    {
      identityTrapdoor: trapdoor,
      identityNullifier: nullifier,
      treePathIndices: merkleProof.pathIndices,
      treeSiblings: merkleProof.siblings,
      externalNullifier: externalNullifier,
      signalHash: signal,
    },
    snarkArtifacts.wasmFilePath,
    snarkArtifacts.zkeyFilePath,
  );

  return {
    merkleTreeRoot: publicSignals[0],
    nullifierHash: publicSignals[1],
    signal: BigNumber.from(signal).toString(),
    externalNullifier: BigNumber.from(externalNullifier).toString(),
    proof: packProof(proof),
  };
}
