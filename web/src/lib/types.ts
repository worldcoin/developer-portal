/**
 * This file contains the main types for both the frontend and backend.
 * Types referring to Hasura models should be defined in models.ts.
 */

import { IconType } from "src/components/Icon";
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

// FIXME: Remove
export interface PublicNullifier {
  nullifier_hash: string;
}

// FIXME: Remove
export interface ContractType {
  key: string;
  value: string;
}

// FIXME: Remove ?
export type EnvironmentType = {
  name: string;
  value: "production" | "staging";
  icon: { name: IconType; noMask?: boolean };
};

export enum OIDCResponseType {
  Code = "code", // authorization code
  JWT = "jwt", // implicit flow
}

export interface IInternalError {
  message: string;
  code: string;
  statusCode?: number;
  attribute?: string | null;
}

export type ActionKioskType = Pick<
  ActionModel,
  "id" | "name" | "description" | "action" | "external_nullifier" | "__typename"
> & {
  app: Pick<
    AppModel,
    "id" | "name" | "logo_url" | "is_staging" | "is_verified" | "__typename"
  >;
};
