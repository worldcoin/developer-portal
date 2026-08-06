import { Pool } from "pg";
import {
  fixture,
  insertV3Nullifier,
  insertV4Nullifier,
  resetFixture,
  seedFixture,
} from "./fresh-stack-fixture";
import { commandOutput, runSqlOperation } from "./run-sql-operation";

const pool = new Pool();

const runParityGate = () => runSqlOperation("backfill-and-validate.sql");

const runCreateNullifierIndex = () =>
  runSqlOperation("create-nullifier-created-at-index.sql");

const utcDate = (daysAgo: number) => {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysAgo,
    ),
  )
    .toISOString()
    .slice(0, 10);
};

const daysAgoIso = (daysAgo: number, hours = 12) => {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  date.setUTCHours(hours, 0, 0, 0);
  return date.toISOString();
};

const rollupRange = (fromDate: string, toDate: string) =>
  pool.query(
    `SELECT * FROM public.rollup_world_id_analytics($1::date, $2::date)`,
    [fromDate, toDate],
  );

const rolledRowCount = async () =>
  Number(
    (
      await pool.query<{ count: string }>(
        `SELECT (
           (SELECT count(*) FROM public.action_legacy_stats_daily)
           + (SELECT count(*) FROM public.action_v4_stats_daily)
         )::text AS count`,
      )
    ).rows[0].count,
  );

const removeParitySabotage = async () => {
  await pool.query(`
    DROP TRIGGER IF EXISTS contract_corrupt_v3_analytics_rollup
      ON public.action_legacy_stats_daily;
    DROP TRIGGER IF EXISTS contract_corrupt_v4_analytics_rollup
      ON public.action_v4_stats_daily;
    DROP FUNCTION IF EXISTS public.contract_corrupt_v3_analytics_rollup();
    DROP FUNCTION IF EXISTS public.contract_corrupt_v4_analytics_rollup();
  `);
};

beforeAll(() => {
  if (process.env.WIA_FRESH_STACK !== "true") {
    throw new Error(
      "Run through the isolated World ID analytics fresh-stack harness",
    );
  }
});

beforeEach(async () => {
  await removeParitySabotage();
  await resetFixture(pool);
  await seedFixture(pool);
});

afterAll(async () => {
  await removeParitySabotage();
  await resetFixture(pool);
  await pool.end();
});

jest.setTimeout(150_000);

// #region Deployment gate
describe("World ID analytics [parity validation gate]", () => {
  it("rejects an invalid same-named concurrent index", async () => {
    const duplicateCreatedAt = daysAgoIso(7);
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_invalid_index_one",
      createdAt: duplicateCreatedAt,
    });
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_invalid_index_two",
      createdAt: duplicateCreatedAt,
    });
    await pool.query("DROP INDEX CONCURRENTLY public.nullifier_created_at_idx");

    try {
      await expect(
        pool.query(`
          CREATE UNIQUE INDEX CONCURRENTLY nullifier_created_at_idx
            ON public.nullifier (created_at)
        `),
      ).rejects.toThrow();

      for (const result of [runCreateNullifierIndex(), runParityGate()]) {
        expect(result.status).not.toBe(0);
        expect(commandOutput(result)).toContain(
          "nullifier_created_at_idx is missing or invalid",
        );
      }
    } finally {
      await pool.query(
        "DROP INDEX CONCURRENTLY IF EXISTS public.nullifier_created_at_idx",
      );
      await pool.query(`
        CREATE INDEX CONCURRENTLY nullifier_created_at_idx
          ON public.nullifier (created_at)
      `);
    }
  });

  it("fails before any validation work when the v4 source index is missing", async () => {
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_index_gate",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });
    await pool.query(
      "DROP INDEX CONCURRENTLY public.nullifier_v4_created_at_idx",
    );

    try {
      const result = runParityGate();

      expect(result.status).not.toBe(0);
      expect(commandOutput(result)).toContain(
        "nullifier_v4_created_at_idx is missing or invalid",
      );
      // The gate aborted before its catch-up, so nothing was rolled up.
      expect(await rolledRowCount()).toBe(0);
    } finally {
      await pool.query(`
        CREATE INDEX CONCURRENTLY nullifier_v4_created_at_idx
          ON public.nullifier_v4 (created_at)
      `);
    }
  });

  it("passes after the dated backfill covered all history", async () => {
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_gate_success",
      createdAt: daysAgoIso(7),
    });
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_gate_success_recent",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });
    await rollupRange(utcDate(10), utcDate(1));

    const result = runParityGate();
    const output = commandOutput(result);

    expect({ error: result.error, output, status: result.status }).toEqual(
      expect.objectContaining({ error: undefined, status: 0 }),
    );
    expect(output).not.toContain("parity validation failed");

    // The gate's own catch-up rebuilt the trailing window inside its
    // snapshot, so the recent row is rolled up after a passing run.
    const recent = await pool.query(
      `SELECT unique_count::text
         FROM public.action_legacy_stats_daily
        WHERE action_id = $1`,
      [fixture.productionV3ActionId],
    );
    expect(recent.rows).toEqual([{ unique_count: "1" }]);
  });

  it("fails when history was never backfilled", async () => {
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_missing_history",
      createdAt: daysAgoIso(7),
    });

    const result = runParityGate();

    expect(result.status).not.toBe(0);
    expect(commandOutput(result)).toContain(
      "Raw/rollup parity validation failed",
    );
    expect(commandOutput(result)).toContain("canonical_missing_or_mismatched");
  });

  it("fails on corrupted v4 counts, then passes after re-rolling the range", async () => {
    await pool.query(`
      CREATE FUNCTION public.contract_corrupt_v4_analytics_rollup()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        NEW.unique_count := NEW.unique_count + 1;
        RETURN NEW;
      END
      $$;

      CREATE TRIGGER contract_corrupt_v4_analytics_rollup
      BEFORE INSERT ON public.action_v4_stats_daily
      FOR EACH ROW
      EXECUTE FUNCTION public.contract_corrupt_v4_analytics_rollup();
    `);
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_gate_mismatch",
      createdAt: daysAgoIso(7),
    });
    await rollupRange(utcDate(10), utcDate(1));

    const result = runParityGate();

    expect(result.status).not.toBe(0);
    expect(commandOutput(result)).toContain(
      "Raw/rollup parity validation failed",
    );

    // The documented repair: re-POST (here: re-roll) the suspect range, no
    // reset step. The rebuild both recounts and sweeps.
    await removeParitySabotage();
    await rollupRange(utcDate(10), utcDate(1));

    const retry = runParityGate();
    expect({
      error: retry.error,
      output: commandOutput(retry),
      status: retry.status,
    }).toEqual(expect.objectContaining({ error: undefined, status: 0 }));

    const rolled = await pool.query(
      `SELECT unique_count::text
         FROM public.action_v4_stats_daily
        WHERE action_v4_id = $1`,
      [fixture.productionV4ActionId],
    );
    expect(rolled.rows).toEqual([{ unique_count: "1" }]);
  });

  it("fails on corrupted v3 counts", async () => {
    await pool.query(`
      CREATE FUNCTION public.contract_corrupt_v3_analytics_rollup()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        NEW.unique_count := NEW.unique_count + 1;
        RETURN NEW;
      END
      $$;

      CREATE TRIGGER contract_corrupt_v3_analytics_rollup
      BEFORE INSERT ON public.action_legacy_stats_daily
      FOR EACH ROW
      EXECUTE FUNCTION public.contract_corrupt_v3_analytics_rollup();
    `);
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_gate_mismatch",
      createdAt: daysAgoIso(7),
    });
    await rollupRange(utcDate(10), utcDate(1));

    const result = runParityGate();

    expect(result.status).not.toBe(0);
    expect(commandOutput(result)).toContain(
      "Raw/rollup parity validation failed",
    );
  });

  it("catches rolled rows whose raw rows were deleted, healed by re-rolling", async () => {
    // A rolled day with no surviving raw rows: the gate must flag it, and
    // re-rolling exactly that range must sweep it.
    await pool.query(
      `INSERT INTO public.action_legacy_stats_daily (
         action_id, date_utc, unique_count
       ) VALUES ($1, '2026-01-01', 5)`,
      [fixture.productionV3ActionId],
    );

    const withoutRepair = runParityGate();
    expect(withoutRepair.status).not.toBe(0);
    expect(commandOutput(withoutRepair)).toContain(
      "rollup_extra_or_mismatched",
    );

    await rollupRange("2026-01-01", "2026-01-01");

    const retry = runParityGate();
    expect({
      error: retry.error,
      output: commandOutput(retry),
      status: retry.status,
    }).toEqual(expect.objectContaining({ error: undefined, status: 0 }));
    expect(await rolledRowCount()).toBe(0);
  });
});
// #endregion
