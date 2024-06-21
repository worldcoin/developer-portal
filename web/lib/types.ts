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

export type TransactionMetadata = {
  transactionId: string;
  transactionHash: string | null;
  transactionStatus: string;
  reference: string;
  miniappId: string;
  updatedAt: string;
  network: string;
  fromWalletAddress: string;
  recipientAddress: string;
  inputToken: string;
  inputTokenAmount: string;
};

export enum TransactionStatus {
  Pending = "pending",
  Mined = "mined",
  Failed = "failed",
}

export type AppStoreMetadataFields = {
  name: string;
  app_id: string;
  logo_img_url: string;
  showcase_img_urls?: any | null;
  hero_image_url: string;
  world_app_description: string;
  world_app_button_text: string;
  whitelisted_addresses?: any | null;
  app_mode: string;
  description: string;
  category: string;
  integration_url: string;
  app_website_url: string;
  source_code_url: string;
  support_email: string;
  supported_countries?: any | null;
  supported_languages?: any | null;
  app: {
    team: { name?: string | null };
  };
};

type NativeApp = {
  app_id: string;
  integration_url: string;
};

export type NativeAppsMap = {
  [key: string]: NativeApp;
};

export type AppStatsItem = {
  app_id: string;
  unique_users: number;
  last_updated_at: string;
};

export type AppStatsReturnType = Array<AppStatsItem>;
