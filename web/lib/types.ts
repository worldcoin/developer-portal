export enum OIDCFlowType {
  AuthorizationCode = "authorization_code",
  Implicit = "implicit",
  Hybrid = "hybrid",
  Token = "token",
}

import { InsertMembershipMutation } from "@/api/create-team/graphql/insert-membership.generated";
/**
 * This file contains the main types for both the frontend and backend.
 * Types referring to Hasura models should be defined in models.ts.
 */

import { UserContext } from "@auth0/nextjs-auth0/client";
import { NextApiRequest } from "next";

export type NextApiRequestWithBody<T> = Omit<NextApiRequest, "body"> & {
  body: T;
};

export enum EngineType {
  OnChain = "on-chain",
  Cloud = "cloud",
}

export enum AppReviewStatus {
  unverified = "Unverified",
  awaiting_review = "Awaiting Review",
  changes_requested = "Changes Requested",
  verified = "Verified",
}

export enum AppStatusType {
  Active = "active",
  Inactive = "inactive",
}

export enum AppLocaliseKeys {
  description_overview = "overview",
  description_how_it_works = "how_it_works",
  description_connect = "connect",
  world_app_button_text = "world_app_button_text",
  world_app_description = "world_app_description",
}

// Options for the `can_user_verify` attribute in the /precheck endpoint
export enum CanUserVerifyType {
  Yes = "yes",
  No = "no",
  Undetermined = "undetermined",
  OnChain = "on-chain",
}

export interface JwtConfig {
  key: string;
  type: "HS512" | "HS384" | "HS256";
}

export type ActionStatsModel = Array<{
  action_id: string;
  date: string;
  total: number;
  total_cumulative: number;
}>;

export enum OIDCResponseType {
  Code = "code", // authorization code
  JWT = "jwt", // implicit flow
  IdToken = "id_token",
  Token = "token",
}

export interface IInternalError {
  message: string;
  code: string;
  statusCode?: number;
  attribute?: string | null;
}

export interface IPendingProofResponse {
  proof: Array<{ Right?: string; Left?: string }> | null;
  root: string | null;
  status: "pending" | "mined" | "new";
}

export enum Environment {
  Production = "production",
  Staging = "staging",
}

export type Auth0EmailUser = {
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  sid: string;
  sub: `email|${string}`;
  email: string;
  email_verified: boolean;
};

export type Auth0WorldcoinUser = {
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  sid: string;
  sub: `oauth2|worldcoin|${string}`;
  email?: never;
  email_verified?: never;
};

export type Auth0PasswordUser = {
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  sid: string;
  sub: `auth0|${string}`;
  email: string;
  email_verified: boolean;
};

export type Auth0User = Auth0EmailUser | Auth0WorldcoinUser | Auth0PasswordUser;

export enum LoginErrorCode {
  Generic = "generic",
  EmailNotVerified = "email-not-verified",
}

export type Auth0SessionUser = Omit<UserContext, "user"> & {
  user?: Auth0User & {
    hasura: NonNullable<
      InsertMembershipMutation["insert_membership_one"]
    >["user"];
  };
};

export enum KioskScreen {
  Waiting,
  Connected,
  AlreadyVerified,
  VerificationRejected,
  ConnectionError,
  Success,
  InvalidIdentity,
  VerificationError,
  InvalidRequest,
}

export type PaymentMetadata = {
  transactionId: string;
  transactionHash: string | null;
  transactionStatus: TransactionStatus;
  reference: string;
  miniappId: string;
  updatedAt: string;
  network: string;
  fromWalletAddress: string;
  recipientAddress: string;
  inputToken: string;
  inputTokenAmount: string;
};

export type TransactionMetadata = {
  transactionId: string;
  transactionHash: string;
  transactionStatus: TransactionStatus;
  miniappId: string;
  updatedAt: string;
  network: string;
  fromWalletAddress: string;
  toContractAddress: string;
};

export enum TransactionTypes {
  Payment = "payment",
  Transaction = "transaction",
}

export enum TransactionStatus {
  Pending = "pending",
  Mined = "mined",
  Failed = "failed",
}

export type AppStoreMetadataFields = {
  name: string;
  app_id: string;
  logo_img_url: string;
  hero_image_url: string;
  meta_tag_image_url: string;
  showcase_img_urls?: any | null;
  world_app_description: string;
  world_app_button_text: string;
  whitelisted_addresses?: any | null;
  app_mode: string;
  description: string;
  category: string;
  integration_url: string;
  app_website_url: string;
  source_code_url: string;
  short_name: string;
  support_link: string;
  supported_countries?: any | null;
  supported_languages?: any | null;
  localisations: LocalisedMetadata[];
  is_reviewer_world_app_approved: boolean;
  associated_domains?: string[] | null;
  contracts?: string[] | null;
  permit2_tokens?: string[] | null;
  can_import_all_contacts?: boolean | null;
  verification_status: string;
  is_allowed_unlimited_notifications?: boolean | null;
  max_notifications_per_day?: number | null;
  is_android_only?: boolean | null;
  notification_state?: string | null;
  notification_state_changed_date?: string | null;
  app: {
    team: { name?: string | null; id: string };
    rating_sum: number;
    rating_count: number;
  };
};

export type LocalisedMetadata = {
  name: string;
  world_app_button_text: string;
  world_app_description: string;
  short_name: string;
  description: string;
  hero_image_url: string;
  meta_tag_image_url: string;
  showcase_img_urls?: string[] | null;
};

export type AppStoreFormattedFields = Omit<
  AppStoreMetadataFields,
  | "description"
  | "category"
  | "app"
  | "localisations"
  | "is_reviewer_world_app_approved"
> & {
  app_rating: number;
  impressions: number;
  ratings_external_nullifier: string;
  show_in_app_store: boolean;
  unique_users: number;
  team_name: string;
  category: { id: string; name: string };
  description: {
    overview: string;
    how_it_works: string;
    how_to_connect: string;
  };
  draft_id?: string;
};

type NativeApp = {
  app_id: string;
  integration_url: string;
  app_mode: "native" | "mini-app";
};

export type NativeAppsMap = {
  [key: string]: NativeApp;
};

type MetricsTimeseries = {
  date: string;
  value: number;
}[];

export type AppStatsItem = {
  app_id: string;
  unique_users: number;
  last_updated_at: string;
  unique_users_last_7_days: number | null;
  total_impressions: number;
  new_users_last_7_days: number | null;
  open_rate_last_14_days: MetricsTimeseries | null;
};

export type AppStatsReturnType = Array<AppStatsItem>;

export type AppStoreMetadataDescription = {
  description_overview: string;
  description_how_it_works: string;
  description_connect: string;
};

export enum TokenPrecision {
  WLD = 18,
  USDCE = 6,
}
