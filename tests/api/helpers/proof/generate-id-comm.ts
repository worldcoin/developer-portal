import { Identity } from '@semaphore-protocol/identity';
import axios from 'axios';
import { keccak256 } from 'ethers';

export const generateIdComm = async (type: 'document' | 'humanity'): Promise<any> => {
  let serviceUrl: string;
  let username: string;
  let password: string;

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
    username = 'worldcoin';
    password = process.env.SIGNUP_DOC_SERVICE_PASSWORD;
  } else {
    serviceUrl = process.env.ORB_SEQUENCER_URL;
    username = 'worldcoin';
    password = process.env.ORB_SEQUENCER_PASSWORD;
  }

  const seed = undefined;
  const newIdentity = new Identity(seed ? keccak256(Buffer.from(seed)) : undefined);
  const identityCommitment = newIdentity.getCommitment();
  const encodedCommitment = '0x' + identityCommitment.toString(16).padStart(64, '0');

  console.log(`ℹ️ encoded identity commitment: ${encodedCommitment}`);
  console.log(`ℹ️ serialized identity`, newIdentity.toString());

  const response = await axios.post(`${serviceUrl}/insertIdentity`, [encodedCommitment], {
    headers: {
      'Content-Type': 'application/json',
    },
    auth: {
      username,
      password,
    },
  });

  if (response.status === 200 || 202) {
    console.log('ℹ️ identity commitment inserted');
  } else {
    throw new Error('Failed to insert identity commitment');
  }

  const data = {
    encodedCommitment, // TODO: "idComm" field was deprecated and removed from the API; remove from here
    newIdentity,
  };

  return data;
};
