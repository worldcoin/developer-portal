import { loadEnvConfig } from "@next/env";
import { parseArgs } from "node:util";
import { Client } from "pg";
import { isAddress } from "ethers";
import {
  getRpFromContract,
  getUserOperationReceipt,
  sendUserOperation,
} from "@/api/helpers/temporal-rpc";
import {
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
  parseRpId,
} from "@/api/helpers/rp-utils";
import { USER_OP_MAX_VALIDITY_MS } from "@/api/helpers/user-operation";
import { isRpSetupPaused } from "@/api/helpers/rp-id-backfill";
import {
  RP_BACKFILL_SETTLE_MARGIN_MS,
  type BackfillRegistry,
} from "@/lib/rp-id-backfill";
import { BackfillStore } from "./rp-id-backfill/store";
import { scanRpIds } from "./rp-id-backfill/scan";
import {
  reconcileRpBatch,
  reserveRpIds,
  type BackfillRpc,
} from "./rp-id-backfill/reserve";

const USAGE = `RP ID backfill (run from web/ with pnpm rp:backfill)
  scan --created-before <UTC timestamp> [--read-concurrency 10]
  reserve --setup-drained [--batch-size 100] [--receipt-timeout-ms 60000]
  reserve --reconcile-request <UserOperation hash> --registry <production|staging> [--wait-for-expiry]

reserve requires RP_ID_BACKFILL_SETUP_PAUSED=true in the serving Portal AND this process.
--setup-drained attests that all serving instances are paused and admitted setup
requests and their operations have finished or passed the full validity window.
Reconciliation never submits; --wait-for-expiry holds the worker lock for a full
operation validity window plus margin before releasing an unreceipted request.`;

function positiveInteger(value: string | undefined, fallback: number) {
  const n = value === undefined ? fallback : Number(value);
  if (!Number.isSafeInteger(n) || n <= 0)
    throw new Error("Limits must be positive integers");
  return n;
}

export async function runRpBackfill(args: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      help: { type: "boolean" },
      "created-before": { type: "string" },
      "read-concurrency": { type: "string" },
      "batch-size": { type: "string" },
      "receipt-timeout-ms": { type: "string" },
      "setup-drained": { type: "boolean" },
      "reconcile-request": { type: "string" },
      registry: { type: "string" },
      "wait-for-expiry": { type: "boolean" },
    },
  });
  if (values.help) {
    console.log(USAGE);
    return 0;
  }
  const command = positionals[0];
  if (positionals.length !== 1 || !["scan", "reserve"].includes(command))
    throw new Error(USAGE);
  if (
    command === "scan" &&
    (!values["created-before"] || values["reconcile-request"])
  )
    throw new Error(
      "scan requires --created-before and does not reconcile requests",
    );
  const batchSize = positiveInteger(values["batch-size"], 100);
  const readConcurrency = positiveInteger(values["read-concurrency"], 10);
  const receiptTimeoutMs = positiveInteger(
    values["receipt-timeout-ms"],
    60_000,
  );
  const requestId = values["reconcile-request"];
  if (
    requestId &&
    (!/^0x[0-9a-f]{64}$/.test(requestId) ||
      !["production", "staging"].includes(values.registry ?? ""))
  )
    throw new Error(
      "Reconciliation requires a valid request hash and --registry",
    );
  if (!requestId && (values.registry || values["wait-for-expiry"]))
    throw new Error("Recovery options require --reconcile-request");
  if (
    command === "reserve" &&
    (!isRpSetupPaused() || (!requestId && !values["setup-drained"]))
  )
    throw new Error("Pause and drain Portal setup before reserve; see --help");

  const addresses = {
    production: process.env.RP_REGISTRY_CONTRACT_ADDRESS!,
    staging: process.env.RP_REGISTRY_STAGING_CONTRACT_ADDRESS!,
  };
  if (
    !Object.values(addresses).every((a) => a && isAddress(a)) ||
    addresses.production.toLowerCase() === addresses.staging.toLowerCase()
  )
    throw new Error("Configure two distinct registry addresses");
  const client = new Client();
  await client.connect();
  const store = new BackfillStore(client);
  try {
    await store.lock();
    const read: BackfillRpc["read"] = (registry, rpId) =>
      getRpFromContract(parseRpId(rpId), addresses[registry]);
    if (command === "scan") {
      console.log(
        JSON.stringify(
          await scanRpIds({
            store,
            read,
            cutoff: values["created-before"]!,
            concurrency: readConcurrency,
          }),
        ),
      );
      return 0;
    }
    const production = getRpRegistryConfig();
    const staging = getStagingRpRegistryConfig();
    const managerKey = process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID?.trim();
    if (!production || !staging || !managerKey)
      throw new Error("Registry and shared manager configuration is required");
    const configs = { production, staging };
    const [{ getKMSClient }, { getEthAddressFromKMS }, { prepareRpBatch }] =
      await Promise.all([
        import("@/api/helpers/kms"),
        import("@/api/helpers/kms-eth"),
        import("@/api/helpers/rp-backfill-transactions"),
      ]);
    const kms = await getKMSClient(production.kmsRegion);
    const manager = await getEthAddressFromKMS(
      kms,
      managerKey,
      production.kmsRegion,
    );
    const rpc: BackfillRpc = {
      read,
      prepare: (registry, batch) =>
        prepareRpBatch(
          configs[registry],
          batch.map((row) => parseRpId(row.rp_id)),
          manager,
          kms,
        ),
      send: async (registry, prepared) =>
        (
          await sendUserOperation(
            prepared.userOp,
            configs[registry].entryPointAddress,
          )
        ).operationHash,
      receipt: getUserOperationReceipt,
    };
    if (requestId) {
      let receipt = await rpc.receipt(requestId);
      let expired = false;
      if (!receipt && values["wait-for-expiry"]) {
        // Start a fresh full interval while holding the exclusive lock. No stored
        // timestamp or operator-provided historical time is needed or trusted.
        const waitMs = USER_OP_MAX_VALIDITY_MS + RP_BACKFILL_SETTLE_MARGIN_MS;
        console.log(
          `Holding worker lock for ${waitMs / 60_000} minutes before expiry reconciliation.`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        await store.assertLocked();
        receipt = await rpc.receipt(requestId);
        expired = true;
      }
      const resolved = await reconcileRpBatch({
        store,
        rpc,
        registry: values.registry as BackfillRegistry,
        requestId,
        manager,
        receipt,
        expired,
      });
      console.log(JSON.stringify({ requestId, resolved }));
      return resolved ? 0 : 2;
    }
    const result = await reserveRpIds({
      store,
      rpc,
      manager,
      batchSize,
      receiptTimeoutMs,
    });
    console.log(JSON.stringify(result));
    return result.unresolved || result.preparationFailures ? 2 : 0;
  } finally {
    try {
      await store.unlock();
    } finally {
      await client.end();
    }
  }
}

if (require.main === module) {
  loadEnvConfig(process.cwd());
  runRpBackfill(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error(
        error instanceof Error ? error.message : "Backfill command failed",
      );
      process.exitCode = 1;
    });
}
