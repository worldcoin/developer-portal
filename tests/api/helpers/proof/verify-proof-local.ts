import { FullProof } from '@semaphore-protocol/proof';
import { verifySemaphoreProof } from './semaphore';

export const verifyProofLocal = async (proof: FullProof): Promise<void> => {
  const isValid = await verifySemaphoreProof(proof);

  if (isValid) {
    console.info('☑️  proof verified locally!');
  } else {
    throw new Error('❌ unable to verify proof locally');
  }
};
