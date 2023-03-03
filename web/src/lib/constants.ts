/**
 * Constants available to both backend and frontend.
 */

// ANCHOR: Orb credential
export const ORB_GROUP_ID = 1;

export const ORB_SEQUENCER_STAGING =
  "https://signup.stage-crypto.worldcoin.dev/inclusionProof";

// ANCHOR: Phone credential
export const PHONE_GROUP_ID = 1; // FIXME should be 10 once it's deployed
export const PHONE_SEQUENCER = "https://signup.stage-crypto.worldcoin.dev"; // FIXME
export const PHONE_SEQUENCER_STAGING =
  "https://signup.stage-crypto.worldcoin.dev"; // FIXME

// ANCHOR: OIDC Base URL
export const OIDC_BASE_URL = "https://id.worldcoin.org";

// ANCHOR: JWKs
export const JWK_ALG = "PS256";
export const JWK_ALG_OIDC = "RS256";
