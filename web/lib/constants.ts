/**
 * Constants available to both backend and frontend.
 */

import {
  AppStoreFormattedFields,
  LoginErrorCode,
  NativeAppsMap,
} from "./types";

export { Categories } from "./categories";

// ANCHOR: Production Sequencers
export const ORB_SEQUENCER = "https://signup-orb-ethereum.crypto.worldcoin.org";
export const PHONE_SEQUENCER =
  "https://signup-phone-ethereum.crypto.worldcoin.org";
export const DOCUMENT_SEQUENCER =
  "https://signup-document.crypto.worldcoin.org";
export const SECURE_DOCUMENT_SEQUENCER =
  "https://signup-document-secure.crypto.worldcoin.org";
export const FACE_SEQUENCER = "https://signup-face.crypto.worldcoin.org";

// ANCHOR: Staging Sequencers
export const ORB_SEQUENCER_STAGING =
  process.env.NEXT_PUBLIC_APP_ENV === "production"
    ? "https://signup-orb-ethereum.stage-crypto.worldcoin.org"
    : "https://signup-orb-ethereum.stage-crypto.worldcoin.dev";
export const PHONE_SEQUENCER_STAGING =
  "https://signup-phone-ethereum.stage-crypto.worldcoin.org";
export const DOCUMENT_SEQUENCER_STAGING =
  "https://signup-document.stage-crypto.worldcoin.org";
export const SECURE_DOCUMENT_SEQUENCER_STAGING =
  "https://signup-document-secure.stage-crypto.worldcoin.org";
export const FACE_SEQUENCER_STAGING =
  "https://signup-face.stage-crypto.worldcoin.dev";

// ANCHOR: OIDC Base URL
export const OIDC_BASE_URL = "https://id.worldcoin.org";
export const DOCS_URL = "https://docs.world.org";
export const DOCS_CLOUD_URL = "https://docs.world.org/id/cloud";

// ANCHOR: JWKs
export const JWK_TIME_TO_LIVE = 30; // days; duration before a JWK is rotated
export const JWK_TTL_USABLE = 7; // days; duration before a JWK is rotated

export const SIMULATOR_URL = "https://simulator.worldcoin.org";
export const TELEGRAM_DEVELOPERS_GROUP_URL = "https://t.me/worldcoindevelopers";
export const TELEGRAM_MATEO_URL = "https://t.me/MateoSauton";
export const DISCORD_URL = "https://world.org/discord";
export const WORLD_STATUS_URL = "https://status.world.org/";
export const WORLD_PRIVACY_URL = "https://world.org/privacy";
export const FAQ_URL = "https://world.org/faqs";

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

export const NativeAppToAppIdMapping: Record<string, Record<string, string>> = {
  dev: {
    TEST_APP: "app_test_123",
  },
  staging: {
    grants: "app_2332482ec46485260714dba51b3ad511",
    invites: "app_901d6025acb2a1492a2f2becb5c83d1d",
    network: "app_a8309f030d83505a1632e1ed9dfb57cc",
    grants_native: "app_staging_39ccc5b13235e4227a7c38b23203e59f",
    contacts: "app_701d0e4883e350804a0811f7b2529425",
  },
  production: {
    grants: "app_d2905e660b94ad24d6fc97816182ab35",
    invites: "app_432af83feb4051e72fd7ee682f365c39",
    network: "app_a23c6398432498825962a9b96294dde1",
    contacts: "app_32fa11ef4b55fc5865dcd6e45ef281f5",
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
    [NativeAppToAppIdMapping.staging.contacts]: {
      app_id: "contacts",
      integration_url: "worldapp://contacts",
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
    [NativeAppToAppIdMapping.production.contacts]: {
      app_id: "contacts",
      integration_url: "worldapp://contacts",
      app_mode: "native",
    },
  },
};

export const AppMode = {
  external: "external",
  ["mini-app"]: "mini-app",
} as const;

export const ORB_APP_TEAM_ID = "team_90a0b1944f38dd67417c3f09e9e7c21b";

export const PARTNER_TEAM_IDS = {
  dev: ["team_4851dd041eee090a180124a5ade0dfdf"],
  staging: [
    "team_1767d2864edd0a422e0974f4a8a406e3",
    "team_00bfc60ed2a1f32fbbc536df77fc7ccc",
    "team_3bb5ee7a81ba12e6624b21d03b4a1b2f",
    "team_ac9fb445581cc231c3fe25187d2ed172",
  ], // IO-Staging-Team, Test Partner, E2E Test Team
  production: [
    "team_4e67539b4bb0f6dfabeba48793cf747d",
    "team_9b50d04b36a7aa4d2562604f67277376",
    "team_47d749c71e3627c69f3a59fc1b21b2ae", // Tinder
    "team_56592d0d26de476126ae29a3904df44e", // Deep Face
    "team_f8bdaaa2da5b9779b9dbd6ab82a705a2", // World ID
  ], // TFH, Test Partner
};

export const DEFAULT_APP_URL = "https://developer.world.org";

export const APP_STORE_FORMATTED_DEFAULTS: AppStoreFormattedFields = {
  name: "",
  app_id: "",
  logo_img_url: "",
  hero_image_url: "",
  meta_tag_image_url: "",
  showcase_img_urls: [],
  content_card_image_url: "",
  world_app_description: "",
  world_app_button_text: "",
  whitelisted_addresses: [],
  app_mode: AppMode.external,
  integration_url: "",
  app_website_url: "",
  source_code_url: "",
  short_name: "",
  support_link: "",
  supported_countries: [],
  supported_languages: [],
  associated_domains: [] as string[],
  contracts: [] as string[],
  permit2_tokens: [] as string[],
  can_import_all_contacts: null,
  can_use_attestation: null,
  verification_status: "",
  is_allowed_unlimited_notifications: false,
  max_notifications_per_day: null,
  is_android_only: false,
  app_rating: 0,
  impressions: 0,
  ratings_external_nullifier: "",
  show_in_app_store: false,
  unique_users: 0,
  team_name: "",
  category: { id: "other", name: "Other" },
  description: { overview: "", how_it_works: "", how_to_connect: "" },
  avg_notification_open_rate: null,
  deleted_at: null,
};

// App store metadata isn't used. This is defined on the client side
// We are adding a placeholder here to define an image to show wherever app store metadata is used.
export const APP_STORE_METADATA: AppStoreFormattedFields = {
  ...APP_STORE_FORMATTED_DEFAULTS,
  integration_url:
    "https://staging.world-id-assets.com/app-store/app-store-banner.png",
  showcase_img_urls: [
    "https://staging.world-id-assets.com/app-store/app-store-banner.png",
  ],
};
