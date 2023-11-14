/**
 * This file contains the main types for both the frontend and backend.
 * Types referring to Hasura models should be defined in models.ts.
 */

import { NextApiRequest } from "next";
import { ActionModel, AppModel } from "./models";

export type NextApiRequestWithBody<T> = Omit<NextApiRequest, "body"> & {
  body: T;
};

export enum CredentialType {
  Orb = "orb",
  Phone = "phone",
}

export enum EngineType {
  OnChain = "on-chain",
  Cloud = "cloud",
}

export enum AppStatusType {
  Active = "active",
  Inactive = "inactive",
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

export enum OIDCFlowType {
  AuthorizationCode = "authorization_code",
  Implicit = "implicit",
  Hybrid = "hybrid",
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

export type ActionKioskType = Pick<
  ActionModel,
  "id" | "name" | "description" | "action" | "external_nullifier" | "__typename"
> & {
  app: Pick<
    AppModel,
    | "id"
    | "name"
    | "verified_app_logo"
    | "is_staging"
    | "is_verified"
    | "__typename"
  >;
};

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

export type Auth0User = Auth0EmailUser | Auth0WorldcoinUser;
