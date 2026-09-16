import { generateRpIdString } from "@/lib/rp";
import {
  classifyBackfillId,
  type BackfillRegistry,
  type BackfillRow,
} from "@/lib/rp-id-backfill";
import type { BackfillStore } from "./store";

export async function scanRpIds({
  store,
  cutoff,
  read,
  concurrency = 10,
  readAttempts = 3,
}: {
  store: Pick<
    BackfillStore,
    "assertLocked" | "assertEmpty" | "loadApps" | "initialize"
  >;
  cutoff: string;
  read: (
    registry: BackfillRegistry,
    rpId: string,
  ) => Promise<{ initialized: boolean }>;
  concurrency?: number;
  readAttempts?: number;
}) {
  if (!Number.isFinite(Date.parse(cutoff)) || !cutoff.endsWith("Z"))
    throw new Error("Supply a valid UTC creation cutoff");
  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    !Number.isInteger(readAttempts) ||
    readAttempts < 1
  )
    throw new Error("Read limits must be positive integers");
  await store.assertLocked();
  await store.assertEmpty();
  const apps = await store.loadApps(cutoff);
  if (!apps.length)
    throw new Error("No eligible apps; work list was not initialized");
  const rows: BackfillRow[] = new Array(apps.length);
  let cursor = 0;
  let failed = false;
  const readWithRetry = async (registry: BackfillRegistry, rpId: string) => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await read(registry, rpId);
      } catch (error) {
        if (attempt >= readAttempts) {
          failed = true;
          throw error;
        }
      }
    }
  };
  // Settle all readers before releasing the lock, even if one exhausts retries.
  const workers = await Promise.allSettled(
    Array.from({ length: Math.min(concurrency, apps.length) }, async () => {
      while (!failed && cursor < apps.length) {
        const index = cursor++;
        const app = apps[index];
        const rpId = generateRpIdString(app.app_id);
        const production = await readWithRetry("production", rpId);
        const staging = await readWithRetry("staging", rpId);
        rows[index] = {
          app_id: app.app_id,
          rp_id: rpId,
          production_status: classifyBackfillId(
            production.initialized,
            app.has_registration,
          ),
          production_request_id: null,
          staging_status: classifyBackfillId(
            staging.initialized,
            app.has_registration,
          ),
          staging_request_id: null,
        };
      }
    }),
  );
  for (const worker of workers)
    if (worker.status === "rejected") throw worker.reason;
  await store.initialize(rows);
  return { scanned: rows.length };
}
