import "server-only";

/**
 * Utilities for RP (Relying Party) operations.
 */

import { keccak256, toUtf8Bytes } from "ethers";
import { GraphQLClient } from "graphql-request";
import { getSdk as getFetchRpRegistrationSdk } from "./graphql/fetch-rp-registration.generated";

export enum RpRegistrationStatus {
  Pending = "pending",
  Registered = "registered",
  Failed = "failed",
  Deactivated = "deactivated",
}

/**
 * RP ID is derived as uint64(keccak256(app_id)).
 */
export function generateRpId(appId: string): bigint {
  const hash = keccak256(toUtf8Bytes(appId));
  const uint64Hex = hash.slice(2, 18);
  return BigInt("0x" + uint64Hex);
}

/**
 * Returns rp_id string (rp_ + 16 hex chars) for database storage.
 */
export function generateRpIdString(appId: string): string {
  const rpId = generateRpId(appId);
  return "rp_" + rpId.toString(16).padStart(16, "0");
}

export function isValidRpId(rpId: string): boolean {
  if (typeof rpId !== "string" || !rpId.startsWith("rp_")) {
    return false;
  }
  const hexPart = rpId.slice(3);
  return hexPart.length === 16 && /^[0-9a-f]+$/i.test(hexPart);
}

/**
 * Converts rp_id string back to numeric rpId for contract calls.
 */
export function parseRpId(rpIdString: string): bigint {
  const hexPart = rpIdString.slice(3);
  return BigInt("0x" + hexPart);
}

/**
 * Maps on-chain RP state to DB status.
 */
export function mapOnChainToDbStatus(
  initialized: boolean,
  active: boolean,
): RpRegistrationStatus {
  if (!initialized) {
    return RpRegistrationStatus.Pending;
  }
  return active ? RpRegistrationStatus.Registered : RpRegistrationStatus.Deactivated;
}

/**
 * Hashes an action string to a uint256 for on-chain verification.
 * If the action is already a numeric string or hex, it's used directly.
 */
export function hashActionToUint256(action: string): bigint {
  if (/^(0x[\da-fA-F]+|\d+)$/.test(action)) {
    return BigInt(action);
  }
  const hash = keccak256(toUtf8Bytes(action));
  return BigInt(hash);
}

/**
 * Resolved RP registration with app details.
 */
export interface ResolvedRpRegistration {
  rp_id: string;
  app_id: string;
  status: string;
  app: {
    id: string;
    status: string;
    is_archived: boolean;
    deleted_at?: string | null;
    app_mode: string | null;
  };
}

/**
 * Result of resolving an app_id or rp_id to an RP registration.
 */
export type ResolveRpRegistrationResult =
  | { success: true; registration: ResolvedRpRegistration }
  | { success: false; error: "invalid_format" | "not_found" };

/**
 * Resolves an app_id (app_xxx) or rp_id (rp_xxx) to an RP registration.
 * Returns the registration with normalized app data, or an error if not found.
 */
export async function resolveRpRegistration(
  client: GraphQLClient,
  routeId: string,
): Promise<ResolveRpRegistrationResult> {
  let registration: ResolvedRpRegistration | null = null;

  if (isValidRpId(routeId)) {
    const response = await getFetchRpRegistrationSdk(
      client,
    ).FetchRpRegistrationByRpId({
      rp_id: routeId,
    });
    const reg = response.rp_registration[0];
    if (reg) {
      registration = {
        rp_id: reg.rp_id,
        app_id: reg.app_id,
        status: reg.status as string,
        app: {
          ...reg.app,
          app_mode: reg.app.app_metadata?.[0]?.app_mode ?? null,
        },
      };
    }
  } else if (routeId.startsWith("app_")) {
    const response = await getFetchRpRegistrationSdk(
      client,
    ).FetchRpRegistration({
      app_id: routeId,
    });
    const reg = response.rp_registration[0];
    if (reg) {
      registration = {
        rp_id: reg.rp_id,
        app_id: reg.app_id,
        status: reg.status as string,
        app: {
          ...reg.app,
          app_mode: reg.app.app_metadata?.[0]?.app_mode ?? null,
        },
      };
    }
  } else {
    return { success: false, error: "invalid_format" };
  }

  if (!registration) {
    return { success: false, error: "not_found" };
  }

  return { success: true, registration };
}
