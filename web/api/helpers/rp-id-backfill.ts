import "server-only";

// A nonzero burn address with no known private key. Never use a generated key.
export const RP_RESERVATION_SIGNER =
  "0x000000000000000000000000000000000000dEaD";
export const RP_BACKFILL_LOCK = 824701;
export type Registry = "production" | "staging";
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

export function rpSetupPaused() {
  return process.env.RP_SETUP_PAUSED === "true";
}
