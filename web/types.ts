import { IconType } from "common/Icon";
import { NextApiRequest } from "next";

export type NextApiRequestWithBody<T> = Omit<NextApiRequest, "body"> & {
  body: T;
};

export enum CredentialType {
  Orb = "orb",
  Phone = "phone",
}

export interface JwtConfig {
  key: string;
  type: "HS512" | "HS384" | "HS256";
}

// Models
export interface UserType {
  id: string;
  name: string;
  email: string;
  is_subscribed?: boolean;
}

export const userInterfaces = ["widget", "hosted_page", "kiosk"] as const;
export type UserInterfacesType = typeof userInterfaces[number];
export type ActionUserInterfaces = {
  enabled_interfaces?: UserInterfacesType[];
};

// FIXME: Out of date type
export interface ActionType {
  id: string;
  name: string;
  action: string;
  external_nullifier: string;
  is_staging: boolean;
  is_archived: boolean;
  public_description: string;
  description: string;
  engine: "cloud" | "on-chain";
  created_at: string; // timestamp
  updated_at: string; // timestamp
  status: "created" | "active" | "inactive";
  return_url: string;
  user_interfaces: ActionUserInterfaces;
  app: AppType;
  app_id: string;
  nullifiers_aggregate?: {
    aggregate: {
      count: number;
    };
  };
}

export interface TeamType {
  id: string;
  name: string;
  apps: Array<AppType>;
  users: Array<UserType>;
}

// FIXME: Out of date type
export interface AppType {
  id: string;
  name: string;
  logo_url: string;
  verified_app_logo: string;
  is_verified: boolean;
  team_id: string;
  actions: Array<ActionType>;
}

export type ActionStatsModel = Array<{
  action_id: string;
  date: string;
  total: number;
  total_cumulative: number;
}>;

export interface PublicNullifier {
  nullifier_hash: string;
}

export interface ModelPublicAction
  extends Pick<
    ActionType,
    | "id"
    | "name"
    | "public_description"
    | "is_staging"
    | "engine"
    | "return_url"
  > {
  app: Pick<AppType, "name" | "verified_app_logo" | "is_verified">;
  nullifiers: PublicNullifier[];
}

export interface ContractType {
  key: string;
  value: string;
}

export type EnvironmentType = {
  name: string;
  value: "production" | "staging";
  icon: { name: IconType; noMask?: boolean };
};

export enum Credentials {
  Phone = "phone",
  Identity = "identity",
  Orb = "orb",
}
