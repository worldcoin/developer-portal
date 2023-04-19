/**
 * Constants available to both backend and frontend.
 */

import { CredentialType, SequencerMappingType } from "./types";

// ANCHOR: Orb credential
export const ORB_SEQUENCER = "https://signup.crypto.worldcoin.dev";
export const ORB_SEQUENCER_STAGING =
  "https://signup-v2.stage-crypto.worldcoin.dev";

// ANCHOR: Phone credential
export const PHONE_SEQUENCER = "https://phone-signup.crypto.worldcoin.dev"; // TODO: Update once deployed
export const PHONE_SEQUENCER_STAGING =
  "https://phone-signup.stage-crypto.worldcoin.dev"; // TODO: Update once deployed

export const SEMAPHORE_GROUP_MAP: Record<CredentialType, number> = {
  [CredentialType.Orb]: 1,
  [CredentialType.Phone]: 1,
};

// ANCHOR: OIDC Base URL
export const OIDC_BASE_URL = "https://id.worldcoin.org";

// ANCHOR: JWKs
export const JWK_TIME_TO_LIVE = 30; // days; duration before a JWK is rotated
