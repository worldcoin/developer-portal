/**
 * This file contains the raw TypeScript types for the Hasura models.
 */

import { CredentialType, VerificationLevel } from "@worldcoin/idkit-core";
import * as jose from "jose";
import { AppStatusType, EngineType } from "@/legacy/lib/types";

type DateTime = string;

export interface TeamModel {
  id: string;
  name: string;
  members?: Array<TeamMemberModel>;
  created_at: DateTime;
  updated_at: DateTime;
  __typename: "team";
}

export interface TeamMemberModel {
  id: string;
  name: string;
  email: string;
  __typename: "user";
}

export interface AppModel {
  id: `app_${string}`;
  is_staging: boolean;
  team_id: string;
  engine: EngineType;
  status: AppStatusType;
  is_archived: boolean;
  created_at: DateTime;
  updated_at?: DateTime;
  app_metadata: AppMetadataModel;
  verified_app_metadata?: AppMetadataModel;
  __typename: "app";
}

export interface AppQueryModel
  extends Omit<AppModel, "app_metadata" | "verified_app_metadata"> {
  app_metadata: AppMetadataModel[];
  verified_app_metadata?: AppMetadataModel[];
}

export interface AppMetadataModel {
  id: `meta_${string}`;
  app_id: `app_${string}`;
  name: string;
  description: string;
  category: string;
  integration_url: string;
  app_website_url: string;
  source_code_url: string;
  is_developer_allow_listing: boolean;
  is_reviewer_app_store_approved: boolean;
  is_reviewer_world_app_approved: boolean;
  world_app_description: string;
  logo_img_url: string;
  showcase_img_urls: string[] | null;
  hero_image_url: string;
  verified_at: DateTime;
  updated_at: DateTime;
  review_message: string;
  verification_status: string;
  __typename: "app_metadata";
}

export interface ActionModel {
  id: string;
  name: string;
  description: string;
  action: string;
  external_nullifier: string;
  max_verifications: number;
  max_accounts_per_user: number;
  app_id: `app_${string}`;
  client_secret: string; // Used for OIDC authentication
  created_at: DateTime;
  updated_at: DateTime;
  kiosk_enabled: boolean;
  status: "active" | "inactive"; // TODO: need add constraint for status field in hasura (or use boolean)
  terms_uri: string;
  privacy_policy_uri: string;
  __typename: "action";
}

export interface ActionModelWithNullifiers extends ActionModel {
  nullifiers: Array<
    Pick<NullifierModel, "id" | "nullifier_hash" | "created_at">
  >;
}

export interface NullifierModel {
  id: string;
  uses: number;
  action_id: string;
  nullifier_hash: string;
  created_at: DateTime;
  updated_at: DateTime;
  __typename: "nullifier";
}

export interface CacheModel {
  id: string;
  key: string;
  value: string;
  created_at: DateTime;
  updated_at: DateTime;
  __typename: "cache";
}

export interface JWKModel {
  id: string;
  kms_id: string;
  public_jwk: jose.JWK;
  expires_at: DateTime;
  created_at: DateTime;
  updated_at: DateTime;
  __typename: "jwks";
}

export interface UserModel {
  id: string;
  email: string;
  name: string;
  team_id: string;
  world_id_nullifier: string;
  auth0Id: string | null;
  is_subscribed: boolean;
  ironclad_id: string;
  created_at: DateTime;
  updated_at: DateTime;
  __typename: "jwks";
}

export interface AuthCodeModel {
  id: string;
  auth_code: string;
  app_id: string;
  expires_at: DateTime;
  nullifier_hash: string;
  code_challenge: string;
  code_challenge_method: string;
  verification_level: VerificationLevel;
  scope: [];
  created_at: DateTime;
  updated_at: DateTime;
  __typename: "auth_code";
}

export interface RedirectModel {
  id: string;
  action_id: string;
  created_at: DateTime;
  updated_at: DateTime;
  redirect_uri: string;
}

export interface AppStatsModel {
  app_id: string;
  date: DateTime;
  verifications: number;
  unique_users: number;
}

export interface APIKeyModel {
  id: string;
  team_id: string;
  created_at: DateTime;
  updated_at?: DateTime;
  is_active: boolean;
  api_key: string;
  name: string;
  __typename: "api_key";
}
