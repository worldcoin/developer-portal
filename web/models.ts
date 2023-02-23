/**
 * This file contains the raw TypeScript types for the Hasura models.
 */

import { AppStatusType, CredentialType, EngineType } from "types";

type DateTime = string;

export interface AppModel {
  id: string;
  name: string;
  description_internal: string;
  is_staging: boolean;
  logo_url: string;
  verified_app_logo: string;
  is_verified: boolean;
  team_id: string;
  engine: EngineType;
  status: AppStatusType;
  user_interfaces: Record<string, unknown>;
  verified_at: DateTime | null;
  created_at: DateTime;
  updated_at: DateTime;
  __typename: "app";
}

export interface ActionModel {
  id: string;
  name: string;
  description: string;
  action: string;
  external_nullifier: string;
  max_verifications: number;
  max_accounts_per_user: number;
  app_id: string;
  created_at: DateTime;
  updated_at: DateTime;
  __typename: "action";
}

export interface NullifierModel {
  id: string;
  action_id: string;
  nullifier_hash: string;
  merkle_root: string;
  created_at: DateTime;
  updated_at: DateTime;
  verification_level: CredentialType;
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
  private_jwk: Record<string, string>;
  public_jwk: Record<string, string>;
  expires_at: DateTime;
  created_at: DateTime;
  updated_at: DateTime;
  __typename: "jwks";
}
