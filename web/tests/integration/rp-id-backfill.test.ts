import { getSdk as rotationSdk } from "@/api/hasura/rotate-signer-key/graphql/claim-rotation-slot.generated";
import { getSdk as modeSdk } from "@/api/hasura/switch-to-self-managed/graphql/claim-mode-switch-slot.generated";
import { getSdk as toggleSdk } from "@/api/hasura/toggle-rp-active/graphql/claim-toggle-slot.generated";
import { SETTLED_STAGING_FILTER } from "@/api/helpers/rp-id-backfill";
import {
  activateReservedRp,
  readRpActivationStatus,
  claimRpActivationRetry,
} from "@/api/helpers/rp-reservation-activation";
import { getSdk as getAppInfoSdk } from "@/api/hasura/register-rp/graphql/get-app-info.generated";
import {
  report,
  reserve,
  scan,
  withBackfillLock,
} from "../../scripts/rp-id-backfill";
import {
  RP_BACKFILL_LOCK,
  RP_RESERVATION_SIGNER,
  BackfillRow,
} from "@/api/helpers/rp-id-backfill";
import {
  generateRpIdString,
  parseRpId,
  RpRegistryConfig,
  WORLD_CHAIN_ID,
} from "@/api/helpers/rp-utils";
import { hashUserOperation, UserOperation } from "@/api/helpers/user-operation";
import RP_ABI from "@/api/helpers/abi/rp-registry.json";
import SAFE_ABI from "@/api/helpers/abi/safe-4337.json";
import { Interface } from "ethers";
import { Client } from "pg";
import { GraphQLClient } from "graphql-request";

// #region Mocks: external chain/KMS only; Postgres and Hasura are real.
const readRp = jest.fn();
const send = jest.fn();
const receipt = jest.fn();
const estimate = jest.fn();
jest.mock("@/api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => readRp(...args),
  sendUserOperation: (...args: unknown[]) => send(...args),
  getUserOperationReceipt: (...args: unknown[]) => receipt(...args),
  estimateRpCallGas: (...args: unknown[]) => estimate(...args),
  getRpNonceFromContract: jest.fn().mockResolvedValue(0n),
  getERC20Allowance: jest.fn().mockResolvedValue((1n << 256n) - 1n),
}));
jest.mock("@/api/helpers/kms", () => ({
  getKMSClient: jest.fn().mockResolvedValue({}),
}));
jest.mock("@/api/helpers/kms-eth", () => ({
  getEthAddressFromKMS: jest
    .fn()
    .mockResolvedValue("0x1111111111111111111111111111111111111111"),
  signEthDigestWithKms: jest
    .fn()
    .mockResolvedValue({ serialized: `0x${"11".repeat(65)}` }),
}));
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(),
}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test data
const enabled = process.env.RUN_RP_BACKFILL_INTEGRATION === "1";
const connectionString = process.env.RP_TEST_DATABASE_URL;
const endpoint = process.env.RP_TEST_HASURA_URL;
const db = new Client({ connectionString });
let fixturesCreated = false;
const teamId = "team_bacfff00000000000000000000000000";
const appId = (n: number) => `app_bacfff${n.toString(16).padStart(26, "0")}`;
const manager = "0x1111111111111111111111111111111111111111";
const config: RpRegistryConfig = {
  contractAddress: "0x2222222222222222222222222222222222222222",
  safeAddress: "0x3333333333333333333333333333333333333333",
  safe4337ModuleAddress: "0x4444444444444444444444444444444444444444",
  entryPointAddress: "0x5555555555555555555555555555555555555555",
  kmsRegion: "us-east-1",
  safeOwnerKmsKeyId: "local-test",
  domainSeparator: `0x${"01".repeat(32)}`,
  updateRpTypehash: `0x${"02".repeat(32)}`,
  credentialSchemaIssuerRegistryAddress:
    "0x6666666666666666666666666666666666666666",
};
const configs = {
  production: config,
  staging: {
    ...config,
    contractAddress: "0x7777777777777777777777777777777777777777",
  },
};
const confirmed = { setupPaused: true, setupDrained: true };
const emptyRp = {
  initialized: false,
  active: false,
  manager,
  signer: RP_RESERVATION_SIGNER,
  oprfKeyId: 0n,
  unverifiedWellKnownDomain: "",
};
const chain = new Map<string, typeof emptyRp>();
const key = (address: string, rp: bigint) => `${address}:${rp}`;
const rows = async () =>
  (await db.query<BackfillRow>("SELECT * FROM rp_id_backfill ORDER BY app_id"))
    .rows;
const addApp = async (
  n: number,
  extra: { deleted?: boolean; staging?: boolean; created?: string } = {},
) => {
  const inserted = await db.query(
    `INSERT INTO app(team_id, name, is_staging, created_at, deleted_at)
    VALUES ($1, 'Reservation test', $2, $3, $4) RETURNING id`,
    [
      teamId,
      extra.staging ?? false,
      extra.created ?? "1800-01-01T00:00:00Z",
      extra.deleted ? "1801-01-01" : null,
    ],
  );
  // The real insert trigger generates an ID even when one is supplied.
  await db.query("UPDATE app SET id = $1 WHERE id = $2", [
    appId(n),
    inserted.rows[0].id,
  ]);
};
async function worklist(count: number, staging = "unused") {
  await db.query(
    `INSERT INTO rp_id_backfill(app_id, rp_id, production_status, staging_status)
    SELECT * FROM unnest($1::varchar[], $2::varchar[], $3::text[], $4::text[])`,
    [
      Array.from({ length: count }, (_, i) => appId(i)),
      Array.from({ length: count }, (_, i) => generateRpIdString(appId(i))),
      Array(count).fill("unused"),
      Array(count).fill(staging),
    ],
  );
}
async function successfulSend(op: UserOperation, entryPoint: string) {
  const hash = hashUserOperation(op, entryPoint, WORLD_CHAIN_ID);
  const safe = new Interface(SAFE_ABI).decodeFunctionData(
    "executeUserOp",
    op.callData,
  );
  const batch = new Interface(RP_ABI).decodeFunctionData(
    "registerMany",
    safe[2],
  );
  const tracked = await db.query(
    `SELECT * FROM rp_id_backfill WHERE production_request_id = $1 OR staging_request_id = $1`,
    [hash],
  );
  expect(tracked.rowCount).toBe(batch[0].length);
  expect(batch[0].length).toBeLessThanOrEqual(100);
  for (let i = 0; i < batch[0].length; i++) {
    expect(batch[1][i].toLowerCase()).toBe(manager.toLowerCase());
    expect(batch[2][i].toLowerCase()).toBe(RP_RESERVATION_SIGNER.toLowerCase());
    expect(batch[3][i]).toBe("");
    chain.set(key(safe[0], batch[0][i]), {
      ...emptyRp,
      initialized: true,
      active: true,
    });
  }
  return { operationHash: hash };
}
function configureActivation() {
  Object.assign(process.env, {
    RP_SETUP_PAUSED: "false",
    RP_REGISTRY_CONTRACT_ADDRESS: config.contractAddress,
    RP_REGISTRY_STAGING_CONTRACT_ADDRESS: configs.staging.contractAddress,
    RP_REGISTRY_SAFE_ADDRESS: config.safeAddress,
    RP_REGISTRY_ENTRYPOINT_ADDRESS: config.entryPointAddress,
    RP_REGISTRY_SAFE_4337_MODULE_ADDRESS: config.safe4337ModuleAddress,
    RP_REGISTRY_KMS_REGION: config.kmsRegion,
    RP_REGISTRY_DOMAIN_SEPARATOR: config.domainSeparator,
    RP_REGISTRY_UPDATE_RP_TYPEHASH: config.updateRpTypehash,
    RP_REGISTRY_STAGING_DOMAIN_SEPARATOR: config.domainSeparator,
    RP_REGISTRY_STAGING_UPDATE_RP_TYPEHASH: config.updateRpTypehash,
    RP_REGISTRY_SAFE_OWNER_KMS_KEY_ID: "local-owner",
    CREDENTIAL_SCHEMA_ISSUER_REGISTRY_ADDRESS:
      config.credentialSchemaIssuerRegistryAddress,
  });
}
// #endregion

(enabled ? describe : describe.skip)(
  "RP reservation with local Postgres/Hasura",
  () => {
    beforeAll(async () => {
      for (const url of [connectionString, endpoint]) {
        if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
          throw new Error(
            "Explicit loopback-only RP_TEST_DATABASE_URL and RP_TEST_HASURA_URL required",
          );
      }
      await db.connect();
      if ((await rows()).length)
        throw new Error(
          "Use an empty local backfill table; existing worklists are never cleared by this suite",
        );
      await db.query(
        "INSERT INTO team(id, name) VALUES ($1, 'RP reservation integration tests')",
        [teamId],
      );
      fixturesCreated = true;
    });
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.RP_SETUP_PAUSED = "true";
      process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID = "local-shared-manager";
      chain.clear();
      readRp.mockImplementation(
        async (rp: bigint, address: string) =>
          chain.get(key(address, rp)) ?? { ...emptyRp },
      );
      estimate.mockResolvedValue(300_000n);
      send.mockImplementation(successfulSend);
      receipt.mockImplementation(async (hash) => ({
        userOpHash: hash,
        success: true,
      }));
      jest.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(async () => {
      if (!fixturesCreated) return;
      jest.useRealTimers();
      jest.restoreAllMocks();
      await db.query(
        "DELETE FROM rp_id_backfill WHERE app_id LIKE 'app_bacfff%'",
      );
      await db.query("DELETE FROM app WHERE team_id = $1", [teamId]);
    });
    afterAll(async () => {
      if (fixturesCreated)
        await db.query("DELETE FROM team WHERE id = $1", [teamId]);
      await db.end();
    });

    it("only one concurrent activation can claim the app", async () => {
      await addApp(0);
      await worklist(1, "reserved");
      await db.query(
        "UPDATE rp_id_backfill SET production_status = 'reserved'",
      );
      const service = new GraphQLClient(endpoint!, {
        headers: {
          "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
          "x-hasura-role": "service",
        },
      });
      configureActivation();
      readRp.mockResolvedValue({ ...emptyRp, initialized: true, active: true });
      send.mockImplementation(async (op, entry) => ({
        operationHash: hashUserOperation(op, entry, WORLD_CHAIN_ID),
      }));
      const row = (await rows())[0];
      const results = await Promise.all([
        activateReservedRp(service, row, config.safeAddress, "Test"),
        activateReservedRp(service, row, config.safeAddress, "Test"),
      ]);
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      expect(results.filter((result) => !result.ok)).toEqual([
        expect.objectContaining({ code: "already_registered" }),
      ]);
      expect(send).toHaveBeenCalledTimes(2);
      expect(
        (
          await db.query(
            "SELECT count(*)::int AS count FROM rp_registration WHERE app_id = $1",
            [appId(0)],
          )
        ).rows[0].count,
      ).toBe(1);
    });

    it("only one concurrent manual retry can claim a failed activation", async () => {
      await addApp(0);
      const rpId = generateRpIdString(appId(0));
      await db.query(
        "INSERT INTO rp_registration(rp_id, app_id, mode, status, signer_address) VALUES ($1, $2, 'managed', 'failed', $3)",
        [rpId, appId(0), config.safeAddress],
      );
      const service = new GraphQLClient(endpoint!, {
        headers: {
          "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
          "x-hasura-role": "service",
        },
      });
      const results = await Promise.all([
        claimRpActivationRetry(service, rpId, "production"),
        claimRpActivationRetry(service, rpId, "production"),
      ]);
      expect(results.sort()).toEqual([false, true]);
    });

    it("stops later batches when Postgres terminates the command's live connection", async () => {
      await worklist(101, "claimed_by_other");
      const runner = new Client({ connectionString });
      await runner.connect();
      const pid = (await runner.query("SELECT pg_backend_pid() AS pid")).rows[0]
        .pid;
      send.mockImplementationOnce(async (op, entry) => {
        const disconnected = new Promise<void>((resolve) =>
          runner.once("error", () => resolve()),
        );
        await db.query("SELECT pg_terminate_backend($1)", [pid]);
        await disconnected;
        return { operationHash: hashUserOperation(op, entry, WORLD_CHAIN_ID) };
      });
      try {
        await expect(reserve(runner, configs, confirmed)).rejects.toThrow(
          "connection lost",
        );
      } finally {
        await runner.end();
      }
      expect(send).toHaveBeenCalledTimes(1);
      const saved = await rows();
      expect(
        saved.filter((row) => row.production_status === "in_progress"),
      ).toHaveLength(100);
      expect(saved[100].production_status).toBe("unused");
    });

    it("atomically excludes maintenance and staging activation retries in either order", async () => {
      await addApp(0);
      const rpId = generateRpIdString(appId(0));
      await db.query(
        "INSERT INTO rp_registration(rp_id, app_id, mode, status, staging_status, signer_address) VALUES ($1, $2, 'managed', 'registered', 'failed', $3)",
        [rpId, appId(0), config.safeAddress],
      );
      const service = new GraphQLClient(endpoint!, {
        headers: {
          "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
          "x-hasura-role": "service",
        },
      });
      const args = { rp_id: rpId, staging_filter: SETTLED_STAGING_FILTER };
      for (const claim of [
        () => rotationSdk(service).ClaimRotationSlot(args),
        () => modeSdk(service).ClaimModeSwitchSlot(args),
        () =>
          toggleSdk(service).ClaimToggleSlot({
            ...args,
            current_status: "registered",
          }),
      ]) {
        await db.query(
          "UPDATE rp_registration SET status = 'registered', staging_status = 'failed' WHERE rp_id = $1",
          [rpId],
        );
        expect(
          await claimRpActivationRetry(service, rpId, "staging", true),
        ).toBe(true);
        expect((await claim()).update_rp_registration?.affected_rows).toBe(0);
        await db.query(
          "UPDATE rp_registration SET status = 'registered', staging_status = 'failed' WHERE rp_id = $1",
          [rpId],
        );
        expect((await claim()).update_rp_registration?.affected_rows).toBe(1);
        expect(
          await claimRpActivationRetry(service, rpId, "staging", true),
        ).toBe(false);
      }
    });

    // #region Atomic scan, cohort, and schema invariants
    it("scans before the cutoff, includes deleted/inactive/archived apps, and classifies registries independently", async () => {
      for (let i = 0; i < 4; i++) await addApp(i, { deleted: i === 0 });
      await addApp(4, { staging: true });
      await addApp(5, { created: "1900-01-01T00:00:00Z" });
      await db.query(
        "UPDATE app SET status = 'inactive', is_archived = true WHERE id = $1",
        [appId(1)],
      );
      await db.query(
        "INSERT INTO rp_registration(rp_id, app_id, mode, status) VALUES ($1, $2, 'self_managed', 'failed')",
        [generateRpIdString(appId(2)), appId(2)],
      );
      for (const n of [2, 3])
        chain.set(
          key(config.contractAddress, parseRpId(generateRpIdString(appId(n)))),
          { ...emptyRp, initialized: true },
        );
      expect(await scan(db, configs, "1900-01-01T00:00:00Z")).toEqual({
        initialized: true,
        count: 4,
      });
      expect((await rows()).map((row) => row.production_status)).toEqual([
        "unused",
        "unused",
        "already_registered",
        "claimed_by_other",
      ]);
      expect(
        (await rows()).every((row) => row.staging_status === "unused"),
      ).toBe(true);
      expect(readRp).toHaveBeenCalledTimes(8);
      expect(readRp.mock.calls.every((call) => call[2] === false)).toBe(true);
      await db.query("DELETE FROM app WHERE id = $1", [appId(0)]);
      expect(await rows()).toHaveLength(4);
      await expect(scan(db, configs, "1900-01-01T00:00:00Z")).rejects.toThrow(
        "already initialized",
      );
      expect(readRp).toHaveBeenCalledTimes(8);
    });

    it("writes nothing after a read failure and allows a later operator scan", async () => {
      await addApp(0);
      await addApp(1);
      readRp.mockRejectedValueOnce(new Error("RPC unavailable"));
      await expect(scan(db, configs, "1900-01-01T00:00:00Z")).rejects.toThrow(
        "RPC unavailable",
      );
      expect(await rows()).toEqual([]);
      expect(readRp).toHaveBeenCalledTimes(1);
      expect((await scan(db, configs, "1900-01-01T00:00:00Z")).count).toBe(2);
    });

    it("does not initialize an empty cohort or accept an implicit UTC cutoff", async () => {
      expect(await scan(db, configs, "1900-01-01T00:00:00Z")).toEqual({
        initialized: false,
        count: 0,
      });
      expect(await report(db)).toMatchObject({ outcome: "no_work" });
      await expect(scan(db, configs, "1900-01-01")).rejects.toThrow(
        "UTC cutoff",
      );
      expect(readRp).not.toHaveBeenCalled();
    });

    it("rolls the complete insert back on a duplicate RP ID and enforces all six columns' constraints", async () => {
      const duplicate = [0, 1].map((n) => ({
        app_id: appId(n),
        rp_id: generateRpIdString(appId(0)),
        production_status: "unused",
        staging_status: "unused",
      }));
      await expect(
        db.query(
          "INSERT INTO rp_id_backfill SELECT * FROM jsonb_populate_recordset(NULL::rp_id_backfill, $1::jsonb)",
          [JSON.stringify(duplicate)],
        ),
      ).rejects.toThrow("unique");
      expect(await rows()).toHaveLength(0);
      const columns = await db.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rp_id_backfill'",
      );
      expect(columns.rows).toHaveLength(6);
      for (const [status, request] of [
        ["in_progress", null],
        ["reserved", "0xhash"],
        ["unknown", null],
        [null, null],
      ]) {
        await expect(
          db.query(
            "INSERT INTO rp_id_backfill VALUES ($1, $2, $3, $4, 'unused', NULL)",
            [appId(0), generateRpIdString(appId(0)), status, request],
          ),
        ).rejects.toThrow();
      }
    });

    it("shares the lock with other commands and direct reconciliation writes", async () => {
      await worklist(1);
      const other = new Client({ connectionString });
      await other.connect();
      try {
        await withBackfillLock(db, async () => {
          await expect(withBackfillLock(other, async () => {})).rejects.toThrow(
            "holds the lock",
          );
          await other.query("SET lock_timeout = '50ms'");
          await expect(
            other.query(
              "UPDATE rp_id_backfill SET production_status = 'reserved'",
            ),
          ).rejects.toThrow("lock timeout");
        });
        await other.query(
          "UPDATE rp_id_backfill SET production_status = 'reserved'",
        );
      } finally {
        await other.end();
      }
    });

    it("exposes the table only to the Hasura service role and denies deletion", async () => {
      await worklist(1);
      const headers = {
        "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
      };
      const service = new GraphQLClient(endpoint!, {
        headers: { ...headers, "x-hasura-role": "service" },
      });
      const read = "{ rp_id_backfill { app_id } }";
      expect(await service.request(read)).toEqual({
        rp_id_backfill: [{ app_id: appId(0) }],
      });
      for (const role of [
        "user",
        "api_key",
        "public",
        "internal_dashboard_readonly",
      ]) {
        const client = new GraphQLClient(endpoint!, {
          headers: { ...headers, "x-hasura-role": role },
        });
        await expect(client.request(read)).rejects.toThrow();
        await expect(
          client.request(
            'mutation { update_rp_id_backfill(where: {}, _set: {production_status: "reserved"}) {affected_rows} }',
          ),
        ).rejects.toThrow();
      }
      await expect(
        service.request(
          "mutation { delete_rp_id_backfill(where: {}) { affected_rows } }",
        ),
      ).rejects.toThrow();
    });
    // #endregion

    // #region Batch submission and closeout
    it("persists before sending 100/100/1 batches in each registry, including orphaned app IDs", async () => {
      await worklist(201);
      expect(await reserve(db, configs, confirmed)).toMatchObject({
        outcome: "complete",
        eligibleUnused: 0,
        unresolved: [],
      });
      expect(send).toHaveBeenCalledTimes(6);
      expect(new Set(send.mock.calls.map((call) => call[0].nonce)).size).toBe(
        6,
      );
      expect(
        (await rows()).every(
          (row) =>
            row.production_status === "reserved" &&
            row.staging_status === "reserved",
        ),
      ).toBe(true);
      expect(
        (
          await db.query(
            "SELECT 1 FROM rp_registration WHERE app_id LIKE 'app_bacfff%'",
          )
        ).rowCount,
      ).toBe(0);
    });

    it("rereads an atomic conflict once, advances to later batches, and never reselects attempted unused rows", async () => {
      await worklist(101, "claimed_by_other");
      send.mockImplementationOnce(async (op, entry) => {
        chain.set(
          key(config.contractAddress, parseRpId(generateRpIdString(appId(0)))),
          { ...emptyRp, initialized: true },
        );
        return { operationHash: hashUserOperation(op, entry, WORLD_CHAIN_ID) };
      });
      receipt.mockImplementationOnce(async (hash) => ({
        userOpHash: hash,
        success: false,
      }));
      expect(await reserve(db, configs, confirmed)).toMatchObject({
        outcome: "incomplete",
        eligibleUnused: 99,
      });
      expect(send).toHaveBeenCalledTimes(2);
      expect(readRp).toHaveBeenCalledTimes(101);
      expect((await rows())[0].production_status).toBe("claimed_by_other");
      expect((await rows())[100].production_status).toBe("reserved");
    });

    it("leaves a lost response unresolved, continues staging, and skips it after restart", async () => {
      await worklist(1);
      send.mockRejectedValueOnce(new Error("lost response"));
      const first = await reserve(db, configs, confirmed);
      expect(first.outcome).toBe("unresolved");
      expect(first.unresolved).toHaveLength(1);
      expect((await rows())[0]).toMatchObject({
        production_status: "in_progress",
        staging_status: "reserved",
      });
      send.mockClear();
      readRp.mockClear();
      receipt.mockClear();
      expect(await reserve(db, configs, confirmed)).toMatchObject({
        outcome: "unresolved",
        unresolved: first.unresolved,
      });
      expect(send).not.toHaveBeenCalled();
      expect(readRp).not.toHaveBeenCalled();
      expect(receipt).not.toHaveBeenCalled();
    });

    it("bounds confirmation waiting and advances after timeout", async () => {
      await worklist(101, "claimed_by_other");
      const realNow = Date.now.bind(Date);
      let offset = 0;
      jest.spyOn(Date, "now").mockImplementation(() => realNow() + offset);
      receipt.mockImplementationOnce(async () => {
        offset += 120_000;
        return null;
      });
      const result = await reserve(db, configs, confirmed);
      expect(result.outcome).toBe("unresolved");
      expect(send).toHaveBeenCalledTimes(2);
      expect((await rows())[100].production_status).toBe("reserved");
    });

    it.each([true, false])(
      "preserves request tracking when rereading receipt success=%s fails",
      async (success) => {
        await worklist(101, "claimed_by_other");
        receipt.mockImplementationOnce(async (hash) => ({
          userOpHash: hash,
          success,
        }));
        readRp.mockRejectedValueOnce(new Error("read failed"));
        expect(await reserve(db, configs, confirmed)).toMatchObject({
          outcome: "unresolved",
        });
        expect(send).toHaveBeenCalledTimes(2);
        expect(
          (await rows()).filter(
            (row) => row.production_status === "in_progress",
          ),
        ).toHaveLength(100);
      },
    );

    it("stops before broadcasting when the lock is lost after preparation", async () => {
      await worklist(101, "claimed_by_other");
      estimate.mockImplementationOnce(async () => {
        await db.query("SELECT pg_advisory_unlock($1)", [RP_BACKFILL_LOCK]);
        return 1n;
      });
      await expect(reserve(db, configs, confirmed)).rejects.toThrow(
        "lock lost",
      );
      expect(send).not.toHaveBeenCalled();
    });

    it("excludes ordinary Portal registrations from eligible work, regardless of mode/status", async () => {
      await addApp(0, { deleted: true });
      await worklist(1);
      await db.query(
        "INSERT INTO rp_registration(rp_id, app_id, mode, status) VALUES ($1, $2, 'self_managed', 'failed')",
        [generateRpIdString(appId(0)), appId(0)],
      );
      expect(await reserve(db, configs, confirmed)).toMatchObject({
        outcome: "complete",
        eligibleUnused: 0,
      });
      expect(send).not.toHaveBeenCalled();
      expect((await rows())[0].production_status).toBe("unused");
    });

    it.each(["tracking", "outcome"])(
      "stops later submissions after a database %s write fails",
      async (stage) => {
        await worklist(101, "claimed_by_other");
        const original = db.query.bind(db);
        jest.spyOn(db, "query").mockImplementation(((
          sql: string,
          ...args: unknown[]
        ) => {
          if (
            sql.startsWith(
              stage === "tracking"
                ? "UPDATE rp_id_backfill SET"
                : "UPDATE rp_id_backfill b SET",
            )
          ) {
            return Promise.reject(new Error("tracking unavailable"));
          }
          return (original as Function)(sql, ...args);
        }) as typeof db.query);
        await expect(reserve(db, configs, confirmed)).rejects.toThrow(
          "tracking unavailable",
        );
        expect(send).toHaveBeenCalledTimes(stage === "tracking" ? 0 : 1);
        expect((await rows())[0].production_status).toBe(
          stage === "tracking" ? "unused" : "in_progress",
        );
      },
    );

    it("does not clear a successful request whose registry state cannot be verified", async () => {
      await worklist(1, "claimed_by_other");
      readRp.mockResolvedValue({
        ...emptyRp,
        initialized: true,
        active: true,
        signer: manager,
      });
      expect(await reserve(db, configs, confirmed)).toMatchObject({
        outcome: "unresolved",
      });
      expect((await rows())[0].production_request_id).toMatch(
        /^0x[0-9a-f]{64}$/,
      );
    });

    it("executes activation claim, tracking, and finalization through real service-role Hasura mutations", async () => {
      await addApp(0);
      await worklist(1, "reserved");
      await db.query(
        "UPDATE rp_id_backfill SET production_status = 'reserved'",
      );
      const service = new GraphQLClient(endpoint!, {
        headers: {
          "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
          "x-hasura-role": "service",
        },
      });
      configureActivation();
      readRp.mockResolvedValue({ ...emptyRp, initialized: true, active: true });
      send.mockImplementation(async (op, entry) => {
        const hash = hashUserOperation(op, entry, WORLD_CHAIN_ID);
        const recorded = await db.query(
          "SELECT * FROM rp_registration WHERE app_id = $1",
          [appId(0)],
        );
        expect(recorded.rows[0]).toMatchObject({
          manager_kms_key_id: "local-shared-manager",
          is_unique_manager_key: false,
        });
        expect([
          recorded.rows[0].operation_hash,
          recorded.rows[0].staging_operation_hash,
        ]).toContain(hash);
        return { operationHash: hash };
      });
      expect(
        await activateReservedRp(
          service,
          (await rows())[0],
          config.safeAddress,
          "Test",
        ),
      ).toMatchObject({ ok: true, status: "pending" });
      expect(
        await claimRpActivationRetry(
          service,
          generateRpIdString(appId(0)),
          "production",
        ),
      ).toBe(false);
      const registration = (
        await db.query("SELECT * FROM rp_registration WHERE app_id = $1", [
          appId(0),
        ])
      ).rows[0];
      readRp.mockResolvedValue({
        ...emptyRp,
        initialized: true,
        active: true,
        signer: config.safeAddress,
      });
      expect(await readRpActivationStatus(service, registration)).toEqual({
        production_status: "registered",
        staging_status: "registered",
      });
      expect((await rows())[0]).toMatchObject({
        production_status: "already_registered",
        staging_status: "already_registered",
      });
      await db.query("UPDATE app SET deleted_at = now() WHERE id = $1", [
        appId(0),
      ]);
      expect(
        await getAppInfoSdk(service).GetAppInfo({ app_id: appId(0) }),
      ).toEqual({ app: [] });
      await db.query(
        "UPDATE rp_registration SET status = 'failed' WHERE app_id = $1",
        [appId(0)],
      );
      expect(
        await claimRpActivationRetry(service, registration.rp_id, "production"),
      ).toBe(false);
      await db.query("UPDATE app SET deleted_at = NULL WHERE id = $1", [
        appId(0),
      ]);
      expect(
        await claimRpActivationRetry(service, registration.rp_id, "production"),
      ).toBe(true);
    });

    it("a stale failed-receipt poll cannot overwrite a newer pending activation", async () => {
      await addApp(0);
      await worklist(1, "reserved");
      await db.query(
        "UPDATE rp_id_backfill SET production_status = 'reserved'",
      );
      const rpId = generateRpIdString(appId(0));
      await db.query(
        "INSERT INTO rp_registration(rp_id, app_id, mode, signer_address, manager_kms_key_id, status, operation_hash) VALUES ($1, $2, 'managed', $3, 'local-shared-manager', 'pending', '0xold')",
        [rpId, appId(0), config.safeAddress],
      );
      const stale = (
        await db.query("SELECT * FROM rp_registration WHERE rp_id = $1", [rpId])
      ).rows[0];
      const service = new GraphQLClient(endpoint!, {
        headers: {
          "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
          "x-hasura-role": "service",
        },
      });
      process.env.RP_REGISTRY_CONTRACT_ADDRESS = config.contractAddress;
      delete process.env.RP_REGISTRY_STAGING_CONTRACT_ADDRESS;
      readRp.mockResolvedValue({ ...emptyRp, initialized: true, active: true });
      receipt.mockImplementationOnce(async (hash) => {
        await db.query(
          "UPDATE rp_registration SET operation_hash = '0xnew', status = 'pending' WHERE rp_id = $1",
          [rpId],
        );
        return { userOpHash: hash, success: false };
      });
      expect(await readRpActivationStatus(service, stale)).toMatchObject({
        production_status: "pending",
      });
      expect(
        (
          await db.query(
            "SELECT status, operation_hash FROM rp_registration WHERE rp_id = $1",
            [rpId],
          )
        ).rows[0],
      ).toEqual({ status: "pending", operation_hash: "0xnew" });
    });

    it("classifies a definite simulation conflict once without broadcasting that batch", async () => {
      await worklist(101, "claimed_by_other");
      chain.set(
        key(config.contractAddress, parseRpId(generateRpIdString(appId(0)))),
        { ...emptyRp, initialized: true },
      );
      estimate.mockRejectedValueOnce(
        Object.assign(new Error("simulation reverted"), {
          code: "CALL_EXCEPTION",
        }),
      );
      expect(await reserve(db, configs, confirmed)).toMatchObject({
        outcome: "incomplete",
        eligibleUnused: 99,
      });
      expect(send).toHaveBeenCalledTimes(1);
      expect((await rows())[0].production_status).toBe("claimed_by_other");
      expect((await rows())[100].production_status).toBe("reserved");
      expect(readRp).toHaveBeenCalledTimes(101);
    });

    it.each(["submission", "receipt"])(
      "preserves its saved request on a mismatched %s hash and advances",
      async (boundary) => {
        await worklist(101, "claimed_by_other");
        if (boundary === "submission")
          send.mockResolvedValueOnce({ operationHash: "0xwrong" });
        else
          receipt.mockResolvedValueOnce({
            userOpHash: "0xwrong",
            success: true,
          });
        expect(await reserve(db, configs, confirmed)).toMatchObject({
          outcome: "unresolved",
        });
        expect(send).toHaveBeenCalledTimes(2);
        const saved = await rows();
        expect(saved[0].production_status).toBe("in_progress");
        expect(saved[0].production_request_id).toMatch(/^0x[0-9a-f]{64}$/);
        expect(saved[100].production_status).toBe("reserved");
      },
    );

    it("rejects duplicate registry addresses before either command changes the worklist", async () => {
      const duplicated = { production: config, staging: config };
      await expect(
        scan(db, duplicated, "1900-01-01T00:00:00Z"),
      ).rejects.toThrow("distinct registries");
      await expect(reserve(db, duplicated, confirmed)).rejects.toThrow(
        "distinct registries",
      );
      expect(await rows()).toEqual([]);
      expect(readRp).not.toHaveBeenCalled();
      expect(send).not.toHaveBeenCalled();
    });

    it("requires both an all-instance pause and proof of drain before any submission", async () => {
      await expect(
        reserve(db, configs, { setupPaused: true, setupDrained: false }),
      ).rejects.toThrow("earlier setup submissions");
      process.env.RP_SETUP_PAUSED = "false";
      await expect(reserve(db, configs, confirmed)).rejects.toThrow(
        "RP_SETUP_PAUSED",
      );
      expect(send).not.toHaveBeenCalled();
    });
    // #endregion
  },
);
