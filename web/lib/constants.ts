/**
 * Constants available to both backend and frontend.
 */

import { LoginErrorCode, NativeAppsMap } from "./types";
export { Categories } from "./categories";
// ANCHOR: Orb credential
export const ORB_SEQUENCER = "https://signup-orb-ethereum.crypto.worldcoin.org";

export const ORB_SEQUENCER_STAGING =
  process.env.NEXT_PUBLIC_APP_ENV === "production"
    ? "https://signup-orb-ethereum.stage-crypto.worldcoin.org"
    : "https://signup-app.stage-crypto.worldcoin.dev";

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

export const TELEGRAM_DEVELOPERS_GROUP_URL = "https://t.me/worldcoindevelopers";

export const TELEGRAM_MATEO_URL = "https://t.me/MateoSauton";

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

export const NativeAppToAppIdMapping: Record<string, Record<string, string>> = {
  dev: {
    TEST_APP: "app_test_123",
  },
  staging: {
    grants: "app_2332482ec46485260714dba51b3ad511",
    invites: "app_901d6025acb2a1492a2f2becb5c83d1d",
    network: "app_a8309f030d83505a1632e1ed9dfb57cc",
    grants_native: "app_staging_39ccc5b13235e4227a7c38b23203e59f",
  },
  production: {
    grants: "app_d2905e660b94ad24d6fc97816182ab35",
    invites: "app_432af83feb4051e72fd7ee682f365c39",
    network: "app_a23c6398432498825962a9b96294dde1",
  },
};

export const NativeApps: Record<string, NativeAppsMap> = {
  dev: {
    app_test_123: {
      app_id: "TEST_APP",
      integration_url: "worldapp://test",
      app_mode: "native",
    },
  },
  staging: {
    [NativeAppToAppIdMapping.staging.grants]: {
      app_id: "grants",
      integration_url: "worldapp://grants",
      app_mode: "native",
    },
    [NativeAppToAppIdMapping.staging.invites]: {
      app_id: "invites",
      integration_url: "worldapp://invites",
      app_mode: "native",
    },
    [NativeAppToAppIdMapping.staging.network]: {
      app_id: "network",
      integration_url: "worldapp://network",
      app_mode: "native",
    },
    [NativeAppToAppIdMapping.staging.grants_native]: {
      app_id: "worldcoin",
      integration_url: "worldapp://worldcoin",
      app_mode: "native",
    },
  },
  production: {
    [NativeAppToAppIdMapping.production.grants]: {
      app_id: "grants",
      integration_url: "worldapp://grants",
      app_mode: "native",
    },
    [NativeAppToAppIdMapping.production.invites]: {
      app_id: "invites",
      integration_url: "worldapp://invites",
      app_mode: "native",
    },
    [NativeAppToAppIdMapping.production.network]: {
      app_id: "network",
      integration_url: "worldapp://network",
      app_mode: "native",
    },
  },
};

export const notificationPermissions = {
  dev: ["team_dd2ecd36c6c45f645e8e5d9a31abdee1"],
  staging: ["team_1767d2864edd0a422e0974f4a8a406e3"], // IO-Staging-Team
  production: ["team_4e67539b4bb0f6dfabeba48793cf747d"], // TFH
};

// These are addresses that have been whitelisted from the permit2 restriction
export const whitelistedAppsPermit2 = [
  "app_a4f7f3e62c1de0b9490a5260cb390b56", // UNO
  "app_013bbbd7b5803a25c8d10d10299608e7", // MEME.Factory
  "app_15daccf5b7d4ec9b7dbba044a8fdeab5", // Poop
];
