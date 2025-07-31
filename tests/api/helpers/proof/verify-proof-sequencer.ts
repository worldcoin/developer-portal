import { FullProof } from '@semaphore-protocol/proof';
import { shapeProofForSequencer } from './shape-proof-for-sequencer';

export const verifyProofSequencer = ({
  proof,
  merkleRoot,
  nullifierHash,
  signalHash,
}: {
  proof: FullProof['proof'];
  nullifierHash: `0x${string}`;
  merkleRoot: string;
  signalHash: string;
}): any => {
  const body = {
    nullifierHash,
    proof: shapeProofForSequencer(proof),
    root: merkleRoot,
    signalHash,
  };

  return body;
};
