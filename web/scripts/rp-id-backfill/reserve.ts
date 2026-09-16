import type { PreparedRpBatch } from "@/api/helpers/rp-backfill-transactions";
import type {
  OnChainRelyingParty,
  UserOperationReceipt,
} from "@/api/helpers/temporal-rpc";
import { logger } from "@/lib/logger";
import {
  BACKFILL_REGISTRIES,
  RP_BACKFILL_PLACEHOLDER_SIGNER,
  classifyBackfillId,
  type BackfillIdentity,
  type BackfillRegistry,
} from "@/lib/rp-id-backfill";
import {
  BatchNoLongerEligibleError,
  type BackfillStore,
  type Resolution,
} from "./store";

type Store = Pick<
  BackfillStore,
  | "assertLocked"
  | "candidates"
  | "claim"
  | "batch"
  | "registeredApps"
  | "resolve"
>;
export type BackfillRpc = {
  read: (
    registry: BackfillRegistry,
    rpId: string,
  ) => Promise<OnChainRelyingParty>;
  prepare: (
    registry: BackfillRegistry,
    batch: BackfillIdentity[],
  ) => Promise<PreparedRpBatch>;
  send: (
    registry: BackfillRegistry,
    prepared: PreparedRpBatch,
  ) => Promise<string>;
  receipt: (requestId: string) => Promise<UserOperationReceipt | null>;
};

/** Read failures leave the WHOLE batch pending; persistence failures propagate. */
export async function reconcileRpBatch({
  store,
  rpc,
  registry,
  requestId,
  manager,
  receipt,
  expired = false,
}: {
  store: Store;
  rpc: BackfillRpc;
  registry: BackfillRegistry;
  requestId: string;
  manager: string;
  receipt: UserOperationReceipt | null;
  expired?: boolean;
}): Promise<boolean> {
  await store.assertLocked();
  if (!receipt && !expired) return false;
  if (receipt && receipt.userOpHash.toLowerCase() !== requestId.toLowerCase())
    throw new Error("Receipt hash does not match batch");
  const batch = await store.batch(registry, requestId);
  if (!batch.length) return true;
  const registered = await store.registeredApps(batch.map((row) => row.app_id));
  let rows: Resolution[];
  try {
    rows = await Promise.all(
      batch.map(async (row) => {
        const chain = await rpc.read(registry, row.rp_id);
        if (receipt?.success && !chain.initialized)
          throw new Error("Successful batch is not visible in registry yet");
        const ours =
          chain.initialized &&
          chain.manager.toLowerCase() === manager.toLowerCase() &&
          chain.signer.toLowerCase() ===
            RP_BACKFILL_PLACEHOLDER_SIGNER.toLowerCase();
        return {
          ...row,
          status:
            receipt?.success && ours && !registered.has(row.app_id)
              ? ("reserved" as const)
              : classifyBackfillId(
                  chain.initialized,
                  registered.has(row.app_id),
                ),
        };
      }),
    );
  } catch (error) {
    logger.warn("Backfill reconciliation read unresolved", {
      registry,
      requestId,
      error,
    });
    return false;
  }
  await store.resolve(registry, requestId, rows);
  return true;
}

export async function reserveRpIds({
  store,
  rpc,
  manager,
  batchSize = 100,
  receiptTimeoutMs = 60_000,
  pollMs = 2_000,
}: {
  store: Store;
  rpc: BackfillRpc;
  manager: string;
  batchSize?: number;
  receiptTimeoutMs?: number;
  pollMs?: number;
}) {
  if (
    !Number.isInteger(batchSize) ||
    batchSize < 1 ||
    !Number.isFinite(receiptTimeoutMs) ||
    receiptTimeoutMs < 0 ||
    !Number.isFinite(pollMs) ||
    pollMs < 0
  )
    throw new Error("Invalid batch or polling limits");
  const result = {
    attempted: 0,
    resolved: 0,
    unresolved: 0,
    preparationFailures: 0,
  };
  for (const registry of BACKFILL_REGISTRIES) {
    let cursor = "";
    for (;;) {
      await store.assertLocked();
      const batch = await store.candidates(registry, cursor, batchSize);
      if (!batch.length) break;
      cursor = batch[batch.length - 1].app_id;
      let prepared: PreparedRpBatch;
      try {
        prepared = await rpc.prepare(registry, batch);
      } catch (error) {
        // Nothing was sent; retain unused rows and advance the invocation cursor.
        logger.warn("Backfill batch preparation failed", {
          registry,
          apps: batch.map((row) => row.app_id),
          error,
        });
        result.preparationFailures += batch.length;
        continue;
      }
      try {
        await store.claim(registry, batch, prepared.requestId);
      } catch (error) {
        if (error instanceof BatchNoLongerEligibleError) continue;
        throw error;
      }
      await store.assertLocked();
      result.attempted += batch.length;
      let receipt: UserOperationReceipt | null = null;
      try {
        const returnedHash = await rpc.send(registry, prepared);
        if (returnedHash.toLowerCase() !== prepared.requestId.toLowerCase())
          throw new Error("Bundler returned a different UserOperation hash");
        const deadline = Date.now() + receiptTimeoutMs;
        do {
          receipt = await rpc.receipt(prepared.requestId);
          if (
            receipt &&
            receipt.userOpHash.toLowerCase() !==
              prepared.requestId.toLowerCase()
          ) {
            receipt = null;
            throw new Error(
              "Receipt hash does not match the requested operation",
            );
          }
          if (receipt || Date.now() >= deadline) break;
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              Math.min(Math.max(pollMs, 1), deadline - Date.now()),
            ),
          );
        } while (Date.now() <= deadline);
      } catch (error) {
        logger.warn("Backfill submission outcome unresolved", {
          registry,
          requestId: prepared.requestId,
          error,
        });
      }
      if (
        receipt &&
        (await reconcileRpBatch({
          store,
          rpc,
          registry,
          requestId: prepared.requestId,
          manager,
          receipt,
        }))
      )
        result.resolved += batch.length;
      else result.unresolved += batch.length;
    }
  }
  return result;
}
