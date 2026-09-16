import { Client } from "pg";
import { GraphQLClient } from "graphql-request";
import { NextRequest } from "next/server";
import { BackfillStore } from "../../scripts/rp-id-backfill/store";
import { scanRpIds } from "../../scripts/rp-id-backfill/scan";
import {
  reserveRpIds,
  reconcileRpBatch,
  type BackfillRpc,
} from "../../scripts/rp-id-backfill/reserve";
import { submitManagedRpRegistration } from "@/api/helpers/rp-registration-flows";
import { GET } from "@/api/v4/rp-status/[rp_id]";
import { generateRpIdString } from "@/lib/rp";
import {
  RP_BACKFILL_PLACEHOLDER_SIGNER,
  type BackfillRegistry,
} from "@/lib/rp-id-backfill";
import type {
  OnChainRelyingParty,
  UserOperationReceipt,
} from "@/api/helpers/temporal-rpc";

// #region I/O mocks (database and GraphQL are real)
jest.mock("server-only", () => ({}));
const chainRead = jest.fn();
const rotate = jest.fn();
const register = jest.fn();
const publicKey = jest.fn();
const kmsClient = jest.fn();
let gql: GraphQLClient;
jest.mock("@/api/helpers/temporal-rpc", () => ({
  getRpFromContract: (...args: unknown[]) => chainRead(...args),
}));
jest.mock("@/api/helpers/rp-transactions", () => ({
  submitRegisterRpTransaction: (...args: unknown[]) => register(...args),
  submitRotateSignerTransaction: (...args: unknown[]) => rotate(...args),
}));
jest.mock("@/api/helpers/kms", () => ({
  getKMSClient: (...args: unknown[]) => kmsClient(...args),
  scheduleKeyDeletion: jest.fn(),
}));
jest.mock("@/api/helpers/kms-eth", () => ({
  getEthAddressFromKMS: (...args: unknown[]) => publicKey(...args),
  createManagerKey: jest.fn(),
}));
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(async () => gql),
}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const manager = `0x${"21".repeat(20)}`;
const signer = `0x${"31".repeat(20)}`;
const productionAddress = `0x${"41".repeat(20)}`;
const stagingAddress = `0x${"51".repeat(20)}`;
const requestHash = (n: number) => `0x${n.toString(16).padStart(64, "0")}`;
const registeredChain = (): OnChainRelyingParty => ({
  initialized: true,
  active: true,
  manager,
  signer: RP_BACKFILL_PLACEHOLDER_SIGNER,
  oprfKeyId: 1n,
  unverifiedWellKnownDomain: "",
});
let db: Client;
let store: BackfillStore;
// #endregion

beforeAll(async () => {
  if (process.env.PGHOST !== "127.0.0.1" || process.env.PGPORT !== "15433")
    throw new Error("Use the isolated backfill integration runner");
  db = new Client();
  await db.connect();
  store = new BackfillStore(db);
  gql = new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
    headers: {
      "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
      "x-hasura-role": "service",
    },
  });
});
beforeEach(async () => {
  jest.clearAllMocks();
  await global.RedisClient?.flushall();
  await db.query("TRUNCATE rp_id_backfill");
  await db.query(
    "DELETE FROM app WHERE name = 'rp-backfill-lifecycle-fixture'",
  );
  await store.lock();
  Object.assign(process.env, {
    NEXT_PUBLIC_APP_ENV: "production",
    RP_ID_BACKFILL_SETUP_PAUSED: "false",
    ENABLE_SHARED_KEY_RP_REGISTRATION: "false",
    RP_REGISTRY_MANAGER_KMS_KEY_ID: "shared-key",
    RP_REGISTRY_SAFE_OWNER_KMS_KEY_ID: "safe-key",
    RP_REGISTRY_CONTRACT_ADDRESS: productionAddress,
    RP_REGISTRY_STAGING_CONTRACT_ADDRESS: stagingAddress,
    RP_REGISTRY_SAFE_ADDRESS: `0x${"61".repeat(20)}`,
    RP_REGISTRY_ENTRYPOINT_ADDRESS: `0x${"71".repeat(20)}`,
    RP_REGISTRY_SAFE_4337_MODULE_ADDRESS: `0x${"81".repeat(20)}`,
    RP_REGISTRY_KMS_REGION: "eu-west-1",
    RP_REGISTRY_DOMAIN_SEPARATOR: requestHash(91),
    RP_REGISTRY_UPDATE_RP_TYPEHASH: requestHash(92),
    RP_REGISTRY_STAGING_DOMAIN_SEPARATOR: requestHash(93),
    RP_REGISTRY_STAGING_UPDATE_RP_TYPEHASH: requestHash(94),
    CREDENTIAL_SCHEMA_ISSUER_REGISTRY_ADDRESS: `0x${"95".repeat(20)}`,
  });
  kmsClient.mockResolvedValue({});
  publicKey.mockResolvedValue(manager);
  rotate.mockResolvedValue(requestHash(900));
});
afterEach(async () => {
  await store.unlock();
});
afterAll(async () => {
  await db.query("TRUNCATE rp_id_backfill");
  await db.query(
    "DELETE FROM app WHERE name = 'rp-backfill-lifecycle-fixture'",
  );
  await db.end();
});

// #region Complete workflow with real persistence
it("scans, continues past failed/unknown batches, reconciles, and independently enables both registries", async () => {
  const team = (await db.query("SELECT id FROM team LIMIT 1")).rows[0].id;
  const ids: string[] = [];
  for (let i = 0; i < 4; i++) {
    const { rows } = await db.query(
      "INSERT INTO app (team_id, name, is_staging, created_at) VALUES ($1, 'rp-backfill-lifecycle-fixture', false, '2026-09-01') RETURNING id",
      [team],
    );
    ids.push(rows[0].id);
  }
  ids.sort();
  const selfManaged = ids.pop()!;
  await db.query(
    "INSERT INTO rp_registration (rp_id, app_id, mode, status, signer_address) VALUES ($1, $2, 'self_managed', 'pending', NULL)",
    [generateRpIdString(selfManaged), selfManaged],
  );
  const chain = new Map<string, OnChainRelyingParty>();
  const key = (registry: BackfillRegistry, rpId: string) =>
    `${registry}:${rpId}`;
  const read = async (registry: BackfillRegistry, rpId: string) =>
    chain.get(key(registry, rpId)) ?? {
      ...registeredChain(),
      initialized: false,
    };
  const loaded = (await store.loadApps("2026-09-16T00:00:00Z")).filter((a) =>
    [...ids, selfManaged].includes(a.app_id),
  );
  await scanRpIds({
    store: {
      assertLocked: () => store.assertLocked(),
      assertEmpty: () => store.assertEmpty(),
      loadApps: async () => loaded,
      initialize: (rows) => store.initialize(rows),
    },
    cutoff: "2026-09-16T00:00:00Z",
    read,
  });

  let sequence = 0;
  let failOnce = true;
  const receipts = new Map<string, UserOperationReceipt>();
  const preparedMembers = new Map<string, string>();
  const rpc: BackfillRpc = {
    read,
    prepare: async (_registry, batch) => {
      const requestId = requestHash(++sequence);
      preparedMembers.set(requestId, batch[0].rp_id);
      return { requestId, userOp: {} as never };
    },
    send: async (registry, prepared) => {
      const rpId = preparedMembers.get(prepared.requestId)!;
      if (registry === "production" && rpId === generateRpIdString(ids[0]))
        return prepared.requestId;
      const success = !(
        registry === "production" &&
        rpId === generateRpIdString(ids[1]) &&
        failOnce
      );
      if (!success) failOnce = false;
      if (success) chain.set(key(registry, rpId), registeredChain());
      receipts.set(prepared.requestId, {
        userOpHash: prepared.requestId,
        success,
      } as UserOperationReceipt);
      return prepared.requestId;
    },
    receipt: async (id) => receipts.get(id) ?? null,
  };
  const result = await reserveRpIds({
    store,
    rpc,
    manager,
    batchSize: 1,
    receiptTimeoutMs: 0,
  });
  expect(result).toMatchObject({ attempted: 6, unresolved: 1, resolved: 5 });
  let rows = (
    await db.query(
      "SELECT * FROM rp_id_backfill WHERE app_id = ANY($1::text[]) ORDER BY app_id",
      [ids],
    )
  ).rows;
  expect(rows.map((r) => r.production_status)).toEqual([
    "in_progress",
    "unused",
    "reserved",
  ]);
  expect(rows.map((r) => r.staging_status)).toEqual([
    "reserved",
    "reserved",
    "reserved",
  ]);
  expect(
    (
      await db.query("SELECT * FROM rp_id_backfill WHERE app_id = $1", [
        selfManaged,
      ])
    ).rows[0],
  ).toMatchObject({ production_status: "unused", staging_status: "unused" });

  const uncertain = rows[0].production_request_id;
  chain.set(key("production", rows[0].rp_id), registeredChain());
  expect(
    await reconcileRpBatch({
      store,
      rpc,
      manager,
      registry: "production",
      requestId: uncertain,
      receipt: { userOpHash: uncertain, success: true } as UserOperationReceipt,
    }),
  ).toBe(true);
  await reserveRpIds({
    store,
    rpc,
    manager,
    batchSize: 100,
    receiptTimeoutMs: 0,
  });
  expect(
    (
      await db.query(
        "SELECT production_status FROM rp_id_backfill WHERE app_id = $1",
        [ids[1]],
      )
    ).rows[0].production_status,
  ).toBe("reserved");

  chainRead.mockImplementation(async (numericId: bigint, address: string) =>
    read(
      address === productionAddress ? "production" : "staging",
      `rp_${numericId.toString(16).padStart(16, "0")}`,
    ),
  );
  const rpId = generateRpIdString(ids[0]);
  const activation = await submitManagedRpRegistration({
    client: gql,
    appId: ids[0],
    signerAddress: signer,
    appName: "App",
    isStaging: false,
  });
  expect(activation).toMatchObject({ ok: true, status: "pending" });
  expect(register).not.toHaveBeenCalled();
  expect(rotate).toHaveBeenCalledTimes(2);
  expect(
    (
      await db.query(
        "SELECT manager_kms_key_id, is_unique_manager_key FROM rp_registration WHERE rp_id = $1",
        [rpId],
      )
    ).rows[0],
  ).toEqual({ manager_kms_key_id: "shared-key", is_unique_manager_key: false });

  chain.set(key("production", rpId), { ...registeredChain(), signer });
  const request = () =>
    new NextRequest(`http://localhost/api/v4/rp-status/${rpId}`);
  await GET(request(), { params: Promise.resolve({ rp_id: rpId }) });
  expect(
    (
      await db.query(
        "SELECT production_status, staging_status FROM rp_id_backfill WHERE app_id = $1",
        [ids[0]],
      )
    ).rows[0],
  ).toEqual({
    production_status: "already_registered",
    staging_status: "reserved",
  });
  chain.set(key("staging", rpId), { ...registeredChain(), signer });
  await global.RedisClient?.flushall();
  await GET(request(), { params: Promise.resolve({ rp_id: rpId }) });
  expect(
    (
      await db.query(
        "SELECT production_status, staging_status FROM rp_id_backfill WHERE app_id = $1",
        [ids[0]],
      )
    ).rows[0],
  ).toEqual({
    production_status: "already_registered",
    staging_status: "already_registered",
  });

  await db.query("DELETE FROM app WHERE id = $1", [ids[2]]);
  expect(
    (
      await db.query(
        "SELECT production_status FROM rp_id_backfill WHERE app_id = $1",
        [ids[2]],
      )
    ).rows[0].production_status,
  ).toBe("reserved");
});
// #endregion
