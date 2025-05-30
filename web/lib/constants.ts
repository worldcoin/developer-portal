/**
 * Constants available to both backend and frontend.
 */

import { LoginErrorCode, NativeAppsMap } from "./types";

export { Categories } from "./categories";

// ANCHOR: Production Sequencers
export const ORB_SEQUENCER = "https://signup-orb-ethereum.crypto.worldcoin.org";
export const PHONE_SEQUENCER =
  "https://signup-phone-ethereum.crypto.worldcoin.org";
export const DOCUMENT_SEQUENCER =
  "https://signup-document.crypto.worldcoin.org";
export const SECURE_DOCUMENT_SEQUENCER =
  "https://signup-document-secure.crypto.worldcoin.org";

// ANCHOR: Staging Sequencers
export const ORB_SEQUENCER_STAGING =
  process.env.NEXT_PUBLIC_APP_ENV === "production"
    ? "https://signup-orb-ethereum.stage-crypto.worldcoin.org"
    : "https://signup-app.stage-crypto.worldcoin.dev";
export const PHONE_SEQUENCER_STAGING =
  "https://signup-phone-ethereum.stage-crypto.worldcoin.org";
export const DOCUMENT_SEQUENCER_STAGING =
  "https://signup-document.stage-crypto.worldcoin.org";
export const SECURE_DOCUMENT_SEQUENCER_STAGING =
  "https://signup-document-secure.stage-crypto.worldcoin.org";

// ANCHOR: OIDC Base URL
export const OIDC_BASE_URL = "https://id.worldcoin.org";
export const DOCS_URL = "https://docs.world.org";

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

export const NATIVE_MAPPED_APP_ID = {
  grants: "grants",
  invites: "invites",
  network: "network",
  contacts: "contacts",
};

export const NativeApps: Record<string, NativeAppsMap> = {
  dev: {
    app_test_123: {
      app_id: "TEST_APP",
      integration_url: "worldapp://test",
      app_mode: "native",
    },
  },
};

// These are addresses that have been whitelisted from the permit2 restriction
export const whitelistedAppsPermit2 = [
  "app_a4f7f3e62c1de0b9490a5260cb390b56", // UNO
  "app_013bbbd7b5803a25c8d10d10299608e7", // MEME.Factory
  "app_15daccf5b7d4ec9b7dbba044a8fdeab5", // Poop
  "app_8e407cfbae7ae51c19b07faff837aeeb", // DNA
  "app_7cf6a578c65c4b7db84bc6734fb0e165", // DNA Wallet
  "app_49fe40f83cfcdf67b7ba716d37e927e4", // Cash
  "app_0d4b759921490adc1f2bd569fda9b53a", // Holdstation Wallet
];

export const whitelistedAppsContracts = [
  "app_a4f7f3e62c1de0b9490a5260cb390b56", // UNO
  "app_8e407cfbae7ae51c19b07faff837aeeb", // DNA
  "app_7cf6a578c65c4b7db84bc6734fb0e165", // DNA Wallet
  "app_d4bce4c056d0cb5ec84c62c6729a66a8", // DNA NFT
  "app_d7389cebfa78ca21072403a20135ae4d", // SurveyBull
];

export const AppMode = {
  external: "external",
  ["mini-app"]: "mini-app",
} as const;

export const PARTNER_TEAM_IDS = {
  dev: ["team_4851dd041eee090a180124a5ade0dfdf"],
  staging: [
    "team_1767d2864edd0a422e0974f4a8a406e3",
    "team_3bb5ee7a81ba12e6624b21d03b4a1b2f",
    "team_ac9fb445581cc231c3fe25187d2ed172",
  ], // IO-Staging-Team, Test Partner, E2E Test Team
  production: [
    "team_4e67539b4bb0f6dfabeba48793cf747d",
    "team_9b50d04b36a7aa4d2562604f67277376",
  ], // TFH, Test Partner
};
