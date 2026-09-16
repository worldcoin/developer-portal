import { Client } from "pg";
import { GraphQLClient } from "graphql-request";
import { BackfillStore } from "../../scripts/rp-id-backfill/store";
import { generateRpIdString } from "@/lib/rp";
import type { BackfillRow } from "@/lib/rp-id-backfill";
import { scanRpIds } from "../../scripts/rp-id-backfill/scan";

// #region Mocks
jest.mock("server-only", () => ({}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const ids = new Map<number, string>();
const appId = (n: number) =>
  ids.get(n) ?? `app_fabacafe${n.toString(16).padStart(24, "0")}`;
const row = (n: number): BackfillRow => ({
  app_id: appId(n),
  rp_id: generateRpIdString(appId(n)),
  production_status: "unused",
  production_request_id: null,
  staging_status: "unused",
  staging_request_id: null,
});
const hash = `0x${"ab".repeat(32)}`;
let db: Client;
let store: BackfillStore;
// #endregion

beforeAll(async () => {
  if (process.env.PGHOST !== "127.0.0.1" || process.env.PGPORT !== "15433")
    throw new Error("Use the isolated RP backfill integration runner");
  db = new Client();
  await db.connect();
  store = new BackfillStore(db);
});
beforeEach(async () => {
  ids.clear();
  await db.query("TRUNCATE rp_id_backfill");
  await db.query(
    "DELETE FROM app WHERE name IN ('backfill fixture', 'rp-backfill-integration-fixture')",
  );
  await store.lock();
});
afterEach(async () => {
  await store.unlock();
});
afterAll(async () => {
  await db.query("TRUNCATE rp_id_backfill");
  await db.query(
    "DELETE FROM app WHERE name IN ('backfill fixture', 'rp-backfill-integration-fixture')",
  );
  await db.end();
});

// #region Real database boundaries
describe("RP backfill Postgres/Hasura", () => {
  it("rolls back the complete initialization on an RP collision", async () => {
    await expect(
      store.initialize([row(1), { ...row(2), rp_id: row(1).rp_id }]),
    ).rejects.toThrow("unique");
    await store.assertEmpty();
    await store.initialize([row(1), row(2)]);
    await expect(store.initialize([row(3)])).rejects.toThrow("empty");
    expect(
      (await db.query("SELECT count(*)::int AS count FROM rp_id_backfill"))
        .rows[0].count,
    ).toBe(2);
  });

  it("excludes another command and detects loss of its session lock", async () => {
    const other = new Client();
    await other.connect();
    try {
      await expect(new BackfillStore(other).lock()).rejects.toThrow("Another");
    } finally {
      await other.end();
    }
    await db.query("SELECT pg_advisory_unlock_all()");
    await expect(store.assertLocked()).rejects.toThrow("lock lost");
  });

  it("enforces status/request invariants and preserves rows without an app", async () => {
    await store.initialize([row(1)]);
    await expect(
      db.query("UPDATE rp_id_backfill SET production_status = 'in_progress'"),
    ).rejects.toThrow("check constraint");
    await expect(
      db.query("UPDATE rp_id_backfill SET staging_status = 'failed'"),
    ).rejects.toThrow("check constraint");
    await db.query(
      "UPDATE rp_id_backfill SET production_status = 'in_progress', production_request_id = $1",
      [hash],
    );
    expect(await store.batch("production", hash)).toEqual([
      { app_id: row(1).app_id, rp_id: row(1).rp_id },
    ]);
    await store.resolve("production", hash, [
      { ...row(1), status: "reserved" },
    ]);
    expect(
      (
        await db.query(
          "SELECT production_status, production_request_id FROM rp_id_backfill",
        )
      ).rows[0],
    ).toEqual({ production_status: "reserved", production_request_id: null });
  });

  it("scans the fixed cohort, then filters current eligibility without pruning retained rows", async () => {
    const { rows: teams } = await db.query("SELECT id FROM team LIMIT 1");
    for (let i = 1; i <= 6; i++) {
      const inserted = await db.query(
        `INSERT INTO app (id, team_id, name, created_at, is_staging, is_archived, status, deleted_at)
        VALUES ($1, $2, 'rp-backfill-integration-fixture', $3, $4, $5, $6, $7) RETURNING id`,
        [
          appId(i),
          teams[0].id,
          i === 6 ? "2026-09-17" : "2026-09-01",
          i === 4,
          i === 2,
          i === 3 ? "inactive" : "active",
          i === 5 ? "2026-09-02" : null,
        ],
      );
      ids.set(i, inserted.rows[0].id);
    }
    // Scope this fixture's load at the DB boundary, retaining the real scanner.
    const apps = (await store.loadApps("2026-09-16T00:00:00Z")).filter((a) =>
      [...ids.values()].includes(a.app_id),
    );
    expect(apps.map((a) => a.app_id)).toEqual(
      [appId(1), appId(2), appId(3)].sort(),
    );
    await scanRpIds({
      store: {
        assertLocked: () => store.assertLocked(),
        assertEmpty: () => store.assertEmpty(),
        loadApps: async () => apps,
        initialize: (rows) => store.initialize(rows),
      },
      cutoff: "2026-09-16T00:00:00Z",
      read: async () => ({ initialized: false }),
    });
    await db.query("UPDATE app SET deleted_at = now() WHERE id = $1", [
      appId(1),
    ]);
    expect(
      (await store.candidates("production", "", 100)).map((a) => a.app_id),
    ).toEqual([appId(2), appId(3)].sort());
    await db.query("DELETE FROM app WHERE id = $1", [appId(1)]);
    expect(
      (await db.query("SELECT count(*)::int AS count FROM rp_id_backfill"))
        .rows[0].count,
    ).toBe(3);
  });

  it("claims all members atomically and requires the matching request to resolve them", async () => {
    const { rows: teams } = await db.query("SELECT id FROM team LIMIT 1");
    const inserted = await db.query(
      "INSERT INTO app (id, team_id, name, is_staging) VALUES ($1, $2, 'rp-backfill-integration-fixture', false) RETURNING id",
      [appId(1), teams[0].id],
    );
    ids.set(1, inserted.rows[0].id);
    await store.initialize([row(1), row(2)]);
    await expect(
      store.claim("production", [row(1), row(2)], hash),
    ).rejects.toThrow("eligibility");
    expect(await store.batch("production", hash)).toEqual([]);
    await store.claim("production", [row(1)], hash);
    expect(await store.candidates("production", "", 100)).toEqual([]);
    await expect(
      store.resolve("production", `0x${"cd".repeat(32)}`, [
        { ...row(1), status: "reserved" },
      ]),
    ).rejects.toThrow("changed");
    expect(await store.batch("production", hash)).toHaveLength(1);
  });

  it("exposes the table only to the Hasura service role", async () => {
    await store.initialize([row(1)]);
    const client = (role: string) =>
      new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
        headers: {
          "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET!,
          "x-hasura-role": role,
          "x-hasura-user-id": "usr_test",
          "x-hasura-team-id": "team_test",
        },
      });
    const query = "{ rp_id_backfill { app_id rp_id } }";
    await expect(client("service").request(query)).resolves.toEqual({
      rp_id_backfill: [{ app_id: row(1).app_id, rp_id: row(1).rp_id }],
    });
    for (const role of [
      "user",
      "api_key",
      "public",
      "internal_dashboard_readonly",
    ])
      await expect(client(role).request(query)).rejects.toThrow();
    await expect(
      client("service").request(
        'mutation { update_rp_id_backfill(where: {}, _set: {app_id: "app_forbidden"}) { affected_rows } }',
      ),
    ).rejects.toThrow();
  });
});
// #endregion
