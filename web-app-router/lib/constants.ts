/**
 * Constants available to both backend and frontend.
 */

import { LoginErrorCode } from "./types";

// ANCHOR: Orb credential
export const ORB_SEQUENCER = "https://signup-orb-ethereum.crypto.worldcoin.org";

export const ORB_SEQUENCER_STAGING =
  "https://signup-orb-ethereum.stage-crypto.worldcoin.org";

// ANCHOR: Phone credential
export const PHONE_SEQUENCER =
  "https://signup-phone-ethereum.crypto.worldcoin.org";

export const PHONE_SEQUENCER_STAGING =
  "https://signup-phone-ethereum.stage-crypto.worldcoin.org";

// ANCHOR: OIDC Base URL
export const OIDC_BASE_URL = "https://id.worldcoin.org";
export const DOCS_URL = "https://docs.worldcoin.org";

// ANCHOR: JWKs
export const JWK_TIME_TO_LIVE = 30; // days; duration before a JWK is rotated
export const JWK_TTL_USABLE = 7; // days; duration before a JWK is rotated

export const loginErrors: Record<LoginErrorCode, string> = {
  [LoginErrorCode.Generic]:
    "There was a problem with your login. Please try again.",

  [LoginErrorCode.EmailNotVerified]:
    "Your email has not been verified. Please check your email for a verification link.",
};
