import { NullifierItem } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/page/VerifiedTable";

type Nullifier_V4 = {
  id: string;
  created_at: string;
  nullifier: string;
  action_v4_id: string;
};

/**
 * Adapts nullifier_v4 structure to match VerifiedTable expectations
 *
 * V4 structure: { id, created_at, nullifier, action_v4_id }
 * VerifiedTable expects: { id, updated_at, nullifier_hash, uses? }
 */
export function adaptNullifierV4(nullifiers: Nullifier_V4[]): NullifierItem[] {
  return nullifiers.map((n) => ({
    id: n.id,
    updated_at: n.created_at, // V4 only has created_at, map to updated_at
    nullifier_hash: n.nullifier, // V4 uses "nullifier" not "nullifier_hash"
    uses: null, // V4 doesn't track uses
  }));
}
