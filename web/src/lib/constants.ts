/**
 * Constants available to both backend and frontend.
 */

import { CredentialType } from "./types";

// ANCHOR: Orb credential
export const ORB_SEQUENCER_STAGING =
  "https://signup.stage-crypto.worldcoin.dev/inclusionProof";

// ANCHOR: Phone credential
export const PHONE_SEQUENCER = "https://signup.stage-crypto.worldcoin.dev"; // FIXME
export const PHONE_SEQUENCER_STAGING =
  "https://phone-signup.stage-crypto.worldcoin.dev";

// ANCHOR: OIDC Base URL
export const OIDC_BASE_URL = "https://id.worldcoin.org";

// ANCHOR: JWKs
export const JWK_ALG = "PS256";
export const JWK_ALG_OIDC = "RS256";

export const SEMAPHORE_GROUP_MAP: Record<CredentialType, number> = {
  [CredentialType.Orb]: 1,
  [CredentialType.Phone]: 1,
};
