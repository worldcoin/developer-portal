/**
 * Constants available to both backend and frontend.
 */

import { internal as IDKitInternal } from "@worldcoin/idkit";

// ANCHOR: Orb credential
export const ORB_GROUP_ID = 1;

export const ORB_SEQUENCER_STAGING =
  "https://signup.stage-crypto.worldcoin.dev/inclusionProof";

// ANCHOR: Phone credential
export const PHONE_GROUP_ID = 1; // FIXME should be 10 once it's deployed
export const PHONE_SEQUENCER = "https://signup.stage-crypto.worldcoin.dev"; // FIXME
export const PHONE_SEQUENCER_STAGING =
  "https://signup.stage-crypto.worldcoin.dev"; // FIXME

// ANCHOR: Developer Portal Authentication
const _devPortalAppId = "app_developer_portal";
export const DEVELOPER_PORTAL_AUTH_APP = {
  id: _devPortalAppId,
  action: "",
  external_nullifier: IDKitInternal.generateExternalNullifier(
    _devPortalAppId,
    ""
  ).digest,
};

// ANCHOR: JWKs
export const JWK_ALG = "PS256";
