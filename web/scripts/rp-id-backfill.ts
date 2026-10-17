/** Run with NODE_OPTIONS=--conditions=react-server pnpm exec tsx scripts/rp-id-backfill.ts. */
import { getKMSClient } from "@/api/helpers/kms";
import {
  getEthAddressFromKMS,
  signEthDigestWithKms,
} from "@/api/helpers/kms-eth";
import {
  BackfillRow,
  BackfillStatus,
  Registry,
  RP_BACKFILL_LOCK,
  RP_RESERVATION_SIGNER,
  rpSetupPaused,
} from "@/api/helpers/rp-id-backfill";
import {
  generateRpIdString,
  parseRpId,
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
  RpRegistryConfig,
  WORLD_CHAIN_ID,
} from "@/api/helpers/rp-utils";
import {
  estimateRpCallGas,
  getRpFromContract,
  getUserOperationReceipt,
  sendUserOperation,
} from "@/api/helpers/temporal-rpc";
import {
  buildUserOperation,
  DEFAULT_GAS_LIMITS,
  encodeSafeUserOpCalldata,
  getRegisterRpNonce,
  getTxExpiration,
  hashSafeUserOp,
  hashUserOperation,
  replacePlaceholderWithSignature,
} from "@/api/helpers/user-operation";
import RP_REGISTRY_ABI from "@/api/helpers/abi/rp-registry.json";
import { getBytes, Interface, isError, toBeHex } from "ethers";
import { Client } from "pg";
import { parseArgs } from "node:util";
import { resolve } from "node:path";

const REGISTRIES: Registry[] = ["production", "staging"];
type Configs = Record<Registry, RpRegistryConfig>;
const CONFIRMATION_TIMEOUT_MS = 120_000;

/** Dedicated session: no pool/reconnect, so losing it prevents further submissions. */
export async function withBackfillLock<T>(
  db: Client,
  run: (assertLock: () => Promise<void>) => Promise<T>,
) {
  const { rows } = await db.query("SELECT pg_try_advisory_lock($1) AS locked", [
    RP_BACKFILL_LOCK,
  ]);
  if (!rows[0].locked)
    throw new Error("Another backfill process holds the lock");
  let disconnected = false;
  const onError = () => {
    disconnected = true;
  };
  db.on("error", onError);
  const assertLock = async () => {
    if (disconnected) throw new Error("Backfill database connection lost");
    const result = await db.query(
      `SELECT EXISTS (
      SELECT 1 FROM pg_locks WHERE pid = pg_backend_pid() AND locktype = 'advisory'
        AND classid = 0 AND objid = $1 AND objsubid = 1 AND granted
    ) AS locked`,
      [RP_BACKFILL_LOCK],
    );
    if (!result.rows[0].locked) throw new Error("Backfill lock lost");
  };
  try {
    return await run(assertLock);
  } finally {
    if (!disconnected)
      await db.query("SELECT pg_advisory_unlock($1)", [RP_BACKFILL_LOCK]);
    db.off("error", onError);
  }
}

function classify(initialized: boolean, registered: boolean): BackfillStatus {
  return !initialized
    ? "unused"
    : registered
      ? "already_registered"
      : "claimed_by_other";
}

export async function scan(db: Client, configs: Configs, cutoff: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(cutoff) ||
    !Number.isFinite(Date.parse(cutoff))
  ) {
    throw new Error(
      "An explicit UTC cutoff is required (YYYY-MM-DDTHH:mm:ssZ)",
    );
  }
  if (
    configs.production.contractAddress.toLowerCase() ===
    configs.staging.contractAddress.toLowerCase()
  ) {
    throw new Error("Production and staging must be distinct registries");
  }
  return withBackfillLock(db, async (assertLock) => {
    const existing = await db.query("SELECT 1 FROM rp_id_backfill LIMIT 1");
    if (existing.rowCount)
      throw new Error("Worklist already initialized; never rescan or prune it");
    const { rows: apps } = await db.query<{ id: string; registered: boolean }>(
      `
      SELECT a.id, EXISTS (SELECT 1 FROM rp_registration r WHERE r.app_id = a.id) AS registered
      FROM app a WHERE NOT a.is_staging AND a.created_at < $1 ORDER BY a.id
    `,
      [cutoff],
    );
    const worklist: BackfillRow[] = [];
    for (const app of apps) {
      const rpId = generateRpIdString(app.id);
      const production = await getRpFromContract(
        parseRpId(rpId),
        configs.production.contractAddress,
        false,
      );
      const staging = await getRpFromContract(
        parseRpId(rpId),
        configs.staging.contractAddress,
        false,
      );
      worklist.push({
        app_id: app.id,
        rp_id: rpId,
        production_status: classify(production.initialized, app.registered),
        production_request_id: null,
        staging_status: classify(staging.initialized, app.registered),
        staging_request_id: null,
      });
    }
    if (!worklist.length) return { initialized: false, count: 0 };
    await assertLock();
    // A single statement is atomic, including all uniqueness/check constraints.
    await db.query(
      `INSERT INTO rp_id_backfill
      SELECT * FROM jsonb_populate_recordset(NULL::rp_id_backfill, $1::jsonb)`,
      [JSON.stringify(worklist)],
    );
    return { initialized: true, count: worklist.length };
  });
}

async function prepareBatch(
  config: RpRegistryConfig,
  batch: BackfillRow[],
  managerAddress: string,
) {
  const kmsClient = await getKMSClient(config.kmsRegion);
  const ids = batch.map((row) => parseRpId(row.rp_id));
  const data = new Interface(RP_REGISTRY_ABI).encodeFunctionData(
    "registerMany",
    [
      ids,
      ids.map(() => managerAddress),
      ids.map(() => RP_RESERVATION_SIGNER),
      ids.map(() => ""),
    ],
  );
  const callGas = await estimateRpCallGas(
    config.safeAddress,
    config.contractAddress,
    data,
  );
  const { validAfter, validUntil } = getTxExpiration();
  const userOp = buildUserOperation(
    config.safeAddress,
    encodeSafeUserOpCalldata(config.contractAddress, 0n, data),
    getRegisterRpNonce(ids[0]),
    validAfter,
    validUntil,
    {
      ...DEFAULT_GAS_LIMITS,
      callGasLimit: toBeHex((callGas * 120n) / 100n + 100_000n),
    },
  );
  const signature = await signEthDigestWithKms(
    kmsClient,
    config.safeOwnerKmsKeyId,
    getBytes(
      hashSafeUserOp(
        userOp,
        WORLD_CHAIN_ID,
        config.safe4337ModuleAddress,
        config.entryPointAddress,
      ),
    ),
    config.kmsRegion,
  );
  if (!signature) throw new Error("Failed to sign reservation operation");
  userOp.signature = replacePlaceholderWithSignature({
    placeholderSig: userOp.signature,
    signature: signature.serialized,
  });
  return {
    userOp,
    requestId: hashUserOperation(
      userOp,
      config.entryPointAddress,
      WORLD_CHAIN_ID,
    ),
  };
}

async function waitForReceipt(requestId: string) {
  const deadline = Date.now() + CONFIRMATION_TIMEOUT_MS;
  // Poll only this submission's receipt, never resend or reconcile earlier requests.
  while (Date.now() < deadline) {
    const receipt = await getUserOperationReceipt(
      requestId,
      Math.min(10_000, deadline - Date.now()),
    );
    if (receipt) {
      if (receipt.userOpHash.toLowerCase() !== requestId.toLowerCase())
        throw new Error("Receipt hash mismatch");
      return receipt;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(2000, remaining)),
    );
  }
  throw new Error("Confirmation timeout");
}

async function readBatch(
  db: Client,
  config: RpRegistryConfig,
  batch: BackfillRow[],
  manager: string,
  success: boolean,
): Promise<BackfillStatus[]> {
  const registrations = await db.query<{ app_id: string }>(
    "SELECT app_id FROM rp_registration WHERE app_id = ANY($1::varchar[])",
    [batch.map((row) => row.app_id)],
  );
  const registered = new Set(registrations.rows.map((row) => row.app_id));
  const states: BackfillStatus[] = [];
  for (const row of batch) {
    const rp = await getRpFromContract(
      parseRpId(row.rp_id),
      config.contractAddress,
      false,
    );
    if (success) {
      if (
        !rp.initialized ||
        !rp.active ||
        rp.manager.toLowerCase() !== manager.toLowerCase() ||
        rp.signer.toLowerCase() !== RP_RESERVATION_SIGNER.toLowerCase() ||
        rp.unverifiedWellKnownDomain !== ""
      ) {
        throw new Error("Confirmed reservation does not match registry state");
      }
      states.push("reserved");
    } else states.push(classify(rp.initialized, registered.has(row.app_id)));
  }
  return states;
}

async function recordBatch(
  db: Client,
  registry: Registry,
  batch: BackfillRow[],
  states: BackfillStatus[],
  requestId: string | null,
) {
  const updated = await db.query(
    `UPDATE rp_id_backfill b SET ${registry}_status = result.status, ${registry}_request_id = NULL
    FROM unnest($1::varchar[], $2::text[]) AS result(app_id, status)
    WHERE b.app_id = result.app_id AND b.${registry}_request_id IS NOT DISTINCT FROM $3
      AND b.${registry}_status = $4`,
    [
      batch.map((row) => row.app_id),
      states,
      requestId,
      requestId ? "in_progress" : "unused",
    ],
  );
  if (updated.rowCount !== batch.length)
    throw new Error("Incomplete outcome tracking; stop submissions");
}

export async function report(db: Client) {
  const { rows } = await db.query<BackfillRow & { registered: boolean }>(`
    SELECT b.*, EXISTS (SELECT 1 FROM rp_registration r WHERE r.app_id = b.app_id) AS registered
    FROM rp_id_backfill b ORDER BY b.app_id`);
  const counts: Record<string, number> = {};
  const unresolved = new Set<string>();
  let eligibleUnused = 0;
  for (const row of rows)
    for (const registry of REGISTRIES) {
      const status = row[`${registry}_status`];
      counts[`${registry}.${status}`] =
        (counts[`${registry}.${status}`] || 0) + 1;
      if (status === "unused" && !row.registered) eligibleUnused++;
      if (status === "in_progress")
        unresolved.add(`${registry}: ${row[`${registry}_request_id`]}`);
    }
  return {
    counts,
    eligibleUnused,
    unresolved: [...unresolved],
    outcome: unresolved.size
      ? "unresolved"
      : eligibleUnused
        ? "incomplete"
        : rows.length
          ? "complete"
          : "no_work",
    operatorAction: unresolved.size
      ? "Keep setup paused; investigate saved requests. Do not reset or resubmit while they may execute."
      : eligibleUnused
        ? "Choose another manual pass or reopen setup knowing eligible IDs remain unprotected."
        : rows.length
          ? "No unresolved requests or eligible unused IDs; setup may reopen."
          : "No worklist; scan an explicit cohort before reserving.",
  };
}

export async function reserve(
  db: Client,
  configs: Configs,
  confirmations: { setupPaused: boolean; setupDrained: boolean },
) {
  if (
    !rpSetupPaused() ||
    !confirmations.setupPaused ||
    !confirmations.setupDrained
  ) {
    throw new Error(
      "Reservation requires RP_SETUP_PAUSED=true and operator confirmation that ALL instances are paused and earlier setup submissions have finished or cannot execute",
    );
  }
  if (
    configs.production.contractAddress.toLowerCase() ===
    configs.staging.contractAddress.toLowerCase()
  ) {
    throw new Error("Production and staging must be distinct registries");
  }
  return withBackfillLock(db, async (assertLock) => {
    const keyId = process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID?.trim();
    if (!keyId) throw new Error("Shared manager key is required");
    const kmsClient = await getKMSClient(configs.production.kmsRegion);
    const manager = await getEthAddressFromKMS(
      kmsClient,
      keyId,
      configs.production.kmsRegion,
    );
    for (const registry of REGISTRIES) {
      let cursor = "";
      while (true) {
        await assertLock();
        const { rows: batch } = await db.query<BackfillRow>(
          `
          SELECT b.* FROM rp_id_backfill b WHERE b.${registry}_status = 'unused' AND b.app_id > $1
            AND NOT EXISTS (SELECT 1 FROM rp_registration r WHERE r.app_id = b.app_id)
          ORDER BY b.app_id LIMIT 100`,
          [cursor],
        );
        if (!batch.length) break;
        // Advance before any attempt so reverted/failed preparations cannot be reselected.
        cursor = batch[batch.length - 1].app_id;
        const config = configs[registry];
        let prepared;
        try {
          prepared = await prepareBatch(config, batch, manager);
        } catch (error) {
          console.error(
            `${registry}: preparation failed; nothing broadcast`,
            error,
          );
          // A definite simulation revert is already a known non-submission. Classify
          // the batch once so a claimed ID cannot wedge every later manual pass.
          if (isError(error, "CALL_EXCEPTION")) {
            let states;
            try {
              states = await readBatch(db, config, batch, manager, false);
            } catch (readError) {
              console.error(
                `${registry}: preflight reread failed; batch remains unused`,
                readError,
              );
              await assertLock();
              continue;
            }
            await assertLock();
            await recordBatch(db, registry, batch, states, null);
          }
          continue;
        }
        await assertLock();
        const tracked = await db.query(
          `UPDATE rp_id_backfill SET ${registry}_status = 'in_progress', ${registry}_request_id = $1
          WHERE app_id = ANY($2::varchar[]) AND ${registry}_status = 'unused'`,
          [prepared.requestId, batch.map((row) => row.app_id)],
        );
        if (tracked.rowCount !== batch.length)
          throw new Error("Incomplete batch tracking; stop submissions");
        await assertLock();
        let states: BackfillStatus[];
        try {
          const sent = await sendUserOperation(
            prepared.userOp,
            config.entryPointAddress,
          );
          if (
            sent.operationHash.toLowerCase() !==
            prepared.requestId.toLowerCase()
          )
            throw new Error("Submission hash mismatch");
          const receipt = await waitForReceipt(prepared.requestId);
          states = await readBatch(db, config, batch, manager, receipt.success);
        } catch (error) {
          console.error(
            `${registry}: ${prepared.requestId} remains unresolved`,
            error,
          );
          // A failed database connection must stop, even if observed during reconciliation.
          await assertLock();
          continue;
        }
        await assertLock();
        await recordBatch(db, registry, batch, states, prepared.requestId);
      }
    }
    return report(db);
  });
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      cutoff: { type: "string" },
      "confirm-setup-paused": { type: "boolean" },
      "confirm-setup-drained": { type: "boolean" },
    },
  });
  const command = positionals[0];
  if (positionals.length !== 1 || !["scan", "reserve"].includes(command))
    throw new Error(
      "Usage: rp-id-backfill.ts scan --cutoff UTC | reserve --confirm-setup-paused --confirm-setup-drained",
    );
  const production = getRpRegistryConfig();
  const staging = getStagingRpRegistryConfig();
  if (!production || !staging)
    throw new Error("Both registry configurations are required");
  // Explicit dedicated connection; never infer a production URL from Hasura credentials.
  if (!process.env.RP_BACKFILL_DATABASE_URL)
    throw new Error(
      "RP_BACKFILL_DATABASE_URL is required (direct Postgres session, no transaction pooler)",
    );
  const db = new Client({
    connectionString: process.env.RP_BACKFILL_DATABASE_URL,
  });
  await db.connect();
  try {
    console.log(
      JSON.stringify(
        command === "scan"
          ? await scan(db, { production, staging }, values.cutoff || "")
          : await reserve(
              db,
              { production, staging },
              {
                setupPaused: !!values["confirm-setup-paused"],
                setupDrained: !!values["confirm-setup-drained"],
              },
            ),
        null,
        2,
      ),
    );
  } finally {
    await db.end();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
