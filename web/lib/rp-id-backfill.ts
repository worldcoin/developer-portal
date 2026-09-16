import { dataSlice, getAddress, id } from "ethers";

export const BACKFILL_REGISTRIES = ["production", "staging"] as const;
export type BackfillRegistry = (typeof BACKFILL_REGISTRIES)[number];
export type BackfillStatus =
  | "unused"
  | "in_progress"
  | "reserved"
  | "already_registered"
  | "claimed_by_other";

export type BackfillRow = {
  app_id: string;
  rp_id: string;
  production_status: BackfillStatus;
  production_request_id: string | null;
  staging_status: BackfillStatus;
  staging_request_id: string | null;
};
export type BackfillIdentity = Pick<BackfillRow, "app_id" | "rp_id">;

// Hash directly to an address, NOT a wallet private key. No private key is known.
export const RP_BACKFILL_PLACEHOLDER_SIGNER = getAddress(
  dataSlice(id("world:developer-portal:rp-id-backfill:placeholder:v1"), 12),
);

export const RP_BACKFILL_SETTLE_MARGIN_MS = 5 * 60 * 1000;

export function backfillColumns(registry: BackfillRegistry) {
  if (registry !== "production" && registry !== "staging") {
    throw new Error("Invalid backfill registry");
  }
  return {
    status: `${registry}_status` as const,
    request: `${registry}_request_id` as const,
  };
}

export function classifyBackfillId(
  initialized: boolean,
  hasPortalRegistration: boolean,
): BackfillStatus {
  if (!initialized) return "unused";
  return hasPortalRegistration ? "already_registered" : "claimed_by_other";
}
