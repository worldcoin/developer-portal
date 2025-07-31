import { BigNumberish, FullProof } from '@semaphore-protocol/proof';
import { encodePacked } from 'viem';

export const shapeProofForSequencer = (proof: FullProof['proof']): any => {
  const encode = (val: BigNumberish): any => encodePacked(['uint256'], [val as bigint]);

  return [
    [encode(proof[0]), encode(proof[1])],
    [
      [encode(proof[2]), encode(proof[3])],
      [encode(proof[4]), encode(proof[5])],
    ],
    [encode(proof[6]), encode(proof[7])],
  ];
};
