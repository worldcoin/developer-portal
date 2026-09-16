import {
  reserveRpIds,
  reconcileRpBatch,
  type BackfillRpc,
} from "../../scripts/rp-id-backfill/reserve";
import {
  RP_BACKFILL_PLACEHOLDER_SIGNER,
  backfillColumns,
  type BackfillRow,
  type BackfillRegistry,
} from "@/lib/rp-id-backfill";
import type { UserOperationReceipt } from "@/api/helpers/temporal-rpc";
import type { BackfillStore } from "../../scripts/rp-id-backfill/store";

// #region Mocks
jest.mock("server-only", () => ({}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const manager = `0x${"11".repeat(20)}`;
const hash = (n: number) => `0x${n.toString(16).padStart(64, "0")}`;
const row = (n: number): BackfillRow => ({
  app_id: `app_${n.toString(16).padStart(32, "0")}`,
  rp_id: `rp_${n.toString(16).padStart(16, "0")}`,
  production_status: "unused",
  production_request_id: null,
  staging_status: "unused",
  staging_request_id: null,
});
const receipt = (requestId: string, success = true) =>
  ({ userOpHash: requestId, success }) as UserOperationReceipt;
const chain = () => ({
  initialized: true,
  active: true,
  manager,
  signer: RP_BACKFILL_PLACEHOLDER_SIGNER,
  oprfKeyId: 1n,
  unverifiedWellKnownDomain: "",
});

function fixture(count: number) {
  const rows = Array.from({ length: count }, (_, i) => row(i + 1));
  let sequence = 0;
  const events: string[] = [];
  const store = {
    assertLocked: jest.fn().mockResolvedValue(undefined),
    candidates: jest.fn(
      async (registry: BackfillRegistry, after: string, limit: number) =>
        rows
          .filter(
            (r) =>
              r.app_id > after &&
              r[backfillColumns(registry).status] === "unused",
          )
          .slice(0, limit),
    ),
    claim: jest.fn(
      async (
        registry: BackfillRegistry,
        batch: BackfillRow[],
        requestId: string,
      ) => {
        events.push(`persist:${requestId}`);
        for (const r of batch) {
          r[backfillColumns(registry).status] = "in_progress";
          r[backfillColumns(registry).request] = requestId;
        }
      },
    ),
    batch: jest.fn(async (registry: BackfillRegistry, requestId: string) =>
      rows.filter((r) => r[backfillColumns(registry).request] === requestId),
    ),
    registeredApps: jest.fn().mockResolvedValue(new Set<string>()),
    resolve: jest.fn(
      async (
        registry: BackfillRegistry,
        requestId: string,
        resolved: Array<
          BackfillRow & { status: BackfillRow["production_status"] }
        >,
      ) => {
        for (const item of resolved) {
          const r = rows.find((r) => r.app_id === item.app_id)!;
          r[backfillColumns(registry).status] = item.status;
          r[backfillColumns(registry).request] = null;
        }
      },
    ),
  };
  const rpc = {
    prepare: jest.fn(
      async (
        _registry: BackfillRegistry,
        _batch: Array<{ app_id: string; rp_id: string }>,
      ) => {
        const requestId = hash(++sequence);
        events.push(`prepare:${requestId}`);
        return { requestId, userOp: {} };
      },
    ),
    send: jest.fn(async (_registry, prepared) => {
      events.push(`send:${prepared.requestId}`);
      return prepared.requestId;
    }),
    receipt: jest.fn(async (requestId) => receipt(requestId)),
    read: jest.fn(async (_registry: BackfillRegistry, _rpId: string) =>
      chain(),
    ),
  };
  const options = {
    store: store as unknown as BackfillStore,
    rpc: rpc as unknown as BackfillRpc,
    manager,
    batchSize: 100,
    receiptTimeoutMs: 0,
  };
  return { rows, store, rpc, options, events };
}
// #endregion

// #region Batch decisions and interruption behavior
describe("RP backfill reservation", () => {
  it("persists before sending and processes 100/100/1 production batches before staging", async () => {
    const f = fixture(201);
    const result = await reserveRpIds(f.options);
    expect(result).toMatchObject({
      attempted: 402,
      resolved: 402,
      unresolved: 0,
    });
    expect(
      f.rpc.prepare.mock.calls.map(([registry, batch]: any) => [
        registry,
        batch.length,
      ]),
    ).toEqual([
      ["production", 100],
      ["production", 100],
      ["production", 1],
      ["staging", 100],
      ["staging", 100],
      ["staging", 1],
    ]);
    expect(f.events.slice(0, 3)).toEqual([
      `prepare:${hash(1)}`,
      `persist:${hash(1)}`,
      `send:${hash(1)}`,
    ]);
    expect(
      f.rows.every(
        (r) =>
          r.production_status === "reserved" &&
          r.staging_status === "reserved" &&
          r.production_request_id === null &&
          r.staging_request_id === null,
      ),
    ).toBe(true);
  });

  it("does not immediately reselect a reverted batch returned to unused", async () => {
    const f = fixture(3);
    f.options.batchSize = 2;
    f.rpc.receipt.mockImplementation(async (id) => receipt(id, id !== hash(1)));
    f.rpc.read.mockImplementation(async (registry: any, id: any) => ({
      ...chain(),
      initialized: !(registry === "production" && id !== row(3).rp_id),
    }));
    await reserveRpIds(f.options);
    expect(f.rpc.send).toHaveBeenCalledTimes(4);
    expect(f.rows.map((r) => r.production_status)).toEqual([
      "unused",
      "unused",
      "reserved",
    ]);
    expect(f.rows.map((r) => r.staging_status)).toEqual([
      "reserved",
      "reserved",
      "reserved",
    ]);
  });

  it("continues past unknown submission outcomes and skips unresolved rows on restart", async () => {
    const f = fixture(3);
    f.options.batchSize = 2;
    f.rpc.send.mockRejectedValueOnce(new Error("response lost"));
    await expect(reserveRpIds(f.options)).resolves.toMatchObject({
      unresolved: 2,
      resolved: 4,
    });
    expect(f.rows[0]).toMatchObject({
      production_status: "in_progress",
      production_request_id: hash(1),
      staging_status: "reserved",
    });
    const count = f.rpc.send.mock.calls.length;
    await reserveRpIds(f.options);
    expect(f.rpc.send).toHaveBeenCalledTimes(count);
  });

  it("advances after a receipt timeout", async () => {
    const f = fixture(2);
    f.options.batchSize = 1;
    f.rpc.receipt.mockResolvedValueOnce(null as never);
    await reserveRpIds(f.options);
    expect(f.rows[0].production_status).toBe("in_progress");
    expect(f.rows[1].production_status).toBe("reserved");
    expect(f.rows.every((r) => r.staging_status === "reserved")).toBe(true);
  });

  it("leaves the entire request unresolved when a reconciliation read fails", async () => {
    const f = fixture(3);
    f.options.batchSize = 2;
    f.rpc.read.mockRejectedValueOnce(new Error("read timeout"));
    await reserveRpIds(f.options);
    expect(
      f.rows.slice(0, 2).every((r) => r.production_request_id === hash(1)),
    ).toBe(true);
    expect(f.rows[2].production_status).toBe("reserved");
  });

  it("records legitimate Portal registrations and external claims after a revert", async () => {
    const f = fixture(2);
    f.rpc.receipt.mockImplementation(async (id) => receipt(id, false));
    f.store.registeredApps.mockResolvedValue(new Set([row(1).app_id]));
    await reserveRpIds(f.options);
    expect(f.rows.map((r) => r.production_status)).toEqual([
      "already_registered",
      "claimed_by_other",
    ]);
  });

  it("stops before sending when the request cannot be persisted", async () => {
    const f = fixture(2);
    f.store.claim.mockRejectedValue(new Error("database unavailable"));
    await expect(reserveRpIds(f.options)).rejects.toThrow(
      "database unavailable",
    );
    expect(f.rpc.send).not.toHaveBeenCalled();
  });

  it("stops further submissions if recording a successful result fails", async () => {
    const f = fixture(2);
    f.options.batchSize = 1;
    f.store.resolve.mockRejectedValue(new Error("database unavailable"));
    await expect(reserveRpIds(f.options)).rejects.toThrow(
      "database unavailable",
    );
    expect(f.rpc.send).toHaveBeenCalledTimes(1);
    expect(f.rows[0].production_request_id).toBe(hash(1));
  });

  it("advances after a preparation failure without marking or sending that batch", async () => {
    const f = fixture(2);
    f.options.batchSize = 1;
    f.rpc.prepare.mockRejectedValueOnce(new Error("KMS unavailable"));
    await expect(reserveRpIds(f.options)).resolves.toMatchObject({
      preparationFailures: 1,
    });
    expect(f.rows[0].production_status).toBe("unused");
    expect(f.rows[1].production_status).toBe("reserved");
    expect(f.rpc.send).toHaveBeenCalledTimes(3);
  });

  it("does not clear an absent receipt until expiry has been established", async () => {
    const f = fixture(1);
    f.rows[0].production_status = "in_progress";
    f.rows[0].production_request_id = hash(1);
    f.rpc.read.mockResolvedValue({ ...chain(), initialized: false });
    const args = {
      ...f.options,
      registry: "production" as const,
      requestId: hash(1),
      receipt: null,
    };
    expect(await reconcileRpBatch(args)).toBe(false);
    expect(f.store.resolve).not.toHaveBeenCalled();
    expect(await reconcileRpBatch({ ...args, expired: true })).toBe(true);
    expect(f.rows[0].production_status).toBe("unused");
    expect(f.rpc.send).not.toHaveBeenCalled();
  });
});
// #endregion
