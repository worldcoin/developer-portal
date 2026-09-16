import "server-only";
import type { GraphQLClient } from "graphql-request";
import { generateRpIdString } from "@/lib/rp";
import { logger } from "@/lib/logger";
import {
  BACKFILL_REGISTRIES,
  backfillColumns,
  type BackfillRegistry,
  type BackfillRow,
} from "@/lib/rp-id-backfill";
import { getSdk } from "./graphql/rp-id-backfill.generated";

export const isRpSetupPaused = () =>
  process.env.RP_ID_BACKFILL_SETUP_PAUSED === "true";

export async function getRpBackfill(
  client: GraphQLClient,
  appId: string,
): Promise<BackfillRow | null> {
  const { rp_id_backfill_by_pk: row } = await getSdk(client).GetRpBackfill({
    app_id: appId,
  });
  if (row && row.rp_id !== generateRpIdString(appId))
    throw new Error("Backfill app/RP identity mismatch");
  return row as BackfillRow | null;
}

export function rpBackfillSetupError(
  row: BackfillRow | null,
  mode: "managed" | "self_managed",
) {
  if (isRpSetupPaused())
    return {
      code: "setup_paused" as const,
      detail: "New World ID 4.0 setup is temporarily paused.",
    };
  if (
    BACKFILL_REGISTRIES.some(
      (registry) => row?.[backfillColumns(registry).status] === "in_progress",
    )
  ) {
    return {
      code: "reservation_in_progress" as const,
      detail:
        "This app has an unresolved RP reservation. Retry after it has been reconciled.",
    };
  }
  if (
    mode === "self_managed" &&
    BACKFILL_REGISTRIES.some(
      (registry) => row?.[backfillColumns(registry).status] === "reserved",
    )
  ) {
    return {
      code: "managed_setup_required" as const,
      detail:
        "Enable managed World ID 4.0 first. A team owner can then switch to self-managed mode.",
    };
  }
  return null;
}

/** Called only after the existing ownership/signer checks confirm this registry. */
export async function finalizeRpBackfill(
  client: GraphQLClient,
  appId: string,
  rpId: string,
  registry: BackfillRegistry,
) {
  try {
    const sdk = getSdk(client);
    const params = { app_id: appId, rp_id: rpId };
    if (registry === "production") await sdk.FinalizeProductionBackfill(params);
    else await sdk.FinalizeStagingBackfill(params);
  } catch (error) {
    // Repeated trusted status reads can repair this; never invalidate a live RP.
    logger.warn("Could not finalize RP backfill state", {
      appId,
      rpId,
      registry,
      error,
    });
  }
}
