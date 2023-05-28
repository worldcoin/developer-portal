/**
 * Constants available to both backend and frontend.
 */

// ANCHOR: Polygon Orb credential
export const POLYGON_ORB_SEQUENCER = "https://signup.crypto.worldcoin.dev";
export const POLYGON_ORB_SEQUENCER_STAGING =
  "https://signup-batching.stage-crypto.worldcoin.dev";

// ANCHOR: Polygon phone credential
export const POLYGON_PHONE_SEQUENCER =
  "https://phone-signup.crypto.worldcoin.dev";
export const POLYGON_PHONE_SEQUENCER_STAGING =
  "https://phone-signup.stage-crypto.worldcoin.dev";

// ANCHOR: Optimism Orb credential
export const OPTIMISM_ORB_SEQUENCER =
  "https://signup-orb-ethereum.stage-crypto.worldcoin.dev"; // TODO: Update to production URL once deployed
export const OPTIMISM_ORB_SEQUENCER_STAGING =
  "https://signup-orb-ethereum.stage-crypto.worldcoin.dev";

// ANCHOR: Optimism phone credential
// TODO: Add sequencer URLs once deployed

// ANCHOR: OIDC Base URL
export const OIDC_BASE_URL = "https://id.worldcoin.org";

// ANCHOR: JWKs
export const JWK_TIME_TO_LIVE = 30; // days; duration before a JWK is rotated
