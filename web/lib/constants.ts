/**
 * Constants available to both backend and frontend.
 */

import { LoginErrorCode, NativeAppsMap } from "./types";

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

export const SIMULATOR_URL = "https://simulator.worldcoin.org";

export const GITHUB_ISSUES_URL = "https://github.com/worldcoin/idkit-js/issues";

export const DISCORD_URL = "https://worldcoin.org/discord";

export const WORLDCOIN_STATUS_URL = "https://status.worldcoin.org/";

export const WORLDCOIN_PRIVACY_URL = "https://worldcoin.org/privacy";

export const FAQ_URL = "https://worldcoin.org/faqs";

export const loginErrors: Record<LoginErrorCode, string> = {
  [LoginErrorCode.Generic]:
    "There was a problem with your login. Please try again.",

  [LoginErrorCode.EmailNotVerified]:
    "Your email has not been verified. Please check your email for a verification link.",
};

export const Categories: Array<{ name: string; lokalise_key: string }> = [
  { name: "Social", lokalise_key: "world_id_partner_category_social" },
  { name: "Gaming", lokalise_key: "world_id_partner_category_gaming" },
  { name: "Business", lokalise_key: "world_id_partner_category_business" },
  { name: "Finance", lokalise_key: "world_id_partner_category_finance" },
  {
    name: "Productivity",
    lokalise_key: "world_id_partner_category_productivity",
  },
  { name: "Other", lokalise_key: "world_id_partner_category_other" },
];

export const NativeAppToAppIdMapping: Record<string, Record<string, string>> = {
  dev: {
    TEST_APP: "app_test_123",
  },
  staging: {
    grants: "app_staging_44e711bce52215150d0a7f31af4f4f33",
    invites: "app_staging_fb0465348ceb59cba6202685cbdc4120",
    network: "app_staging_44210a8be72aa299410be44232b1ea57",
  },
  production: {},
};

export const NativeApps: Record<string, NativeAppsMap> = {
  dev: {
    app_test_123: {
      app_id: "TEST_APP",
      integration_url: "worldapp://test",
    },
  },
  staging: {
    [NativeAppToAppIdMapping.staging.grants]: {
      app_id: "grants",
      integration_url: "worldapp://grants",
    },
    [NativeAppToAppIdMapping.staging.invites]: {
      app_id: "invites",
      integration_url: "worldapp://invites",
    },
    [NativeAppToAppIdMapping.staging.network]: {
      app_id: "network",
      integration_url: "worldapp://network",
    },
  },
  production: {},
};
