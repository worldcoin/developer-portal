import { Identity } from '@semaphore-protocol/identity';
import axios from 'axios';
import * as path from 'path';
import { encodePacked } from 'viem';
import { retryUntilSuccess } from '../retry-until-success';
import { hashToField } from './hashing';
import { generateSemaphoreProof } from './semaphore';
import { MerkleProof, MerkleTreeResponse } from './types';
import { verifyProofLocal } from './verify-proof-local';
import { verifyProofSequencer } from './verify-proof-sequencer';

export const generateProof = async (
  newIdentity: Identity,
  signal: string,
  type: 'document' | 'humanity',
): Promise<any> => {
  const wasmFilePath = 'semaphore/semaphore.wasm';
  const finalZkeyPath = 'semaphore/semaphore.zkey';
  const identityCommitment = newIdentity.getCommitment();
  const encodedCommitment = '0x' + identityCommitment.toString(16).padStart(64, '0');
  let serviceUrl: string;
  let externalNullifier: string;

  console.log(`ℹ️ retrieved id commitment, fetching inclusion proof: ${encodedCommitment}`);

  if (
    !process.env.SIGNUP_DOC_SERVICE_URL ||
    !process.env.SIGNUP_DOC_SERVICE_USERNAME ||
    !process.env.SIGNUP_DOC_SERVICE_PASSWORD ||
    !process.env.ORB_SEQUENCER_URL ||
    !process.env.ORB_SEQUENCER_USERNAME ||
    !process.env.ORB_SEQUENCER_PASSWORD
  ) {
    throw new Error('One or more required environment variables for proof generation are not set!');
  }

  if (type === 'document') {
    serviceUrl = process.env.SIGNUP_DOC_SERVICE_URL;
    externalNullifier = '0xC16C00C5';
  } else {
    serviceUrl = process.env.ORB_SEQUENCER_URL;
    externalNullifier = '0xB16B00B5';
  }

  const inclusionProof = await retryUntilSuccess({
    delay: 5000,
    maxAttempts: 15,
    task: async () => {
      const response = await axios.post(`${serviceUrl}/inclusionProof`, [encodedCommitment], {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(response.data.status).toEqual('pending');
      return response;
    },
  });

  const merkleTree: MerkleTreeResponse = inclusionProof.data;
  const siblings = merkleTree?.proof.flatMap((v) => Object.values(v)).map((v) => BigInt(v));
  const pathIndices = merkleTree?.proof.flatMap((v) => Object.keys(v)).map((v) => (v === 'Left' ? 0 : 1));

  const merkleProof = {
    root: null,
    leaf: null,
    siblings: siblings,
    pathIndices: pathIndices,
  } as MerkleProof;

  const signalWithoutLeadingZeroes = '0x' + BigInt(signal).toString(16);

  // const { hash: signalHash, digest: signalHashDigest } = hashToField(eoaAddress);

  const signalHash = '0x' + hashToField(signalWithoutLeadingZeroes).hash.toString(16);

  const fullProof = await generateSemaphoreProof(newIdentity, merkleProof, externalNullifier, signalHash, {
    wasmFilePath: path.join(__dirname, wasmFilePath),
    zkeyFilePath: path.join(__dirname, finalZkeyPath),
  });

  const nullifierHash = encodePacked(['uint256'], [fullProof.nullifierHash as bigint]);
  await verifyProofLocal(fullProof);

  const data = verifyProofSequencer({
    proof: fullProof.proof,
    merkleRoot: merkleTree.root,
    signalHash: signalHash,
    nullifierHash,
  });

  return data;
};
