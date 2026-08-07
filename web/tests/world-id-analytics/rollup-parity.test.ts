import { Pool } from "pg";
import { readParityMismatches } from "./canonical-analytics";
import {
  fixture,
  insertV3Nullifier,
  insertV4Nullifier,
  resetFixture,
  seedFixture,
} from "./fresh-stack-fixture";
import { commandOutput, runSqlOperation } from "./run-sql-operation";

const pool = new Pool();

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

const rollupRange = (fromDate: string | null, toDate: string | null) =>
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

// #region Index script gate
describe("World ID analytics [index operations script]", () => {
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

      const result = runCreateNullifierIndex();
      expect(result.status).not.toBe(0);
      expect(commandOutput(result)).toContain(
        "nullifier_created_at_idx is missing or invalid",
      );
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
});
// #endregion

// #region Raw/rollup parity
describe("World ID analytics [raw/rollup parity]", () => {
  it("holds after the dated backfill plus a trailing-window rollup", async () => {
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_parity_success",
      createdAt: daysAgoIso(7),
    });
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_parity_success_recent",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });

    await rollupRange(utcDate(10), utcDate(1));
    await rollupRange(null, null);

    expect(await readParityMismatches(pool)).toEqual([]);
    const recent = await pool.query(
      `SELECT unique_count::text
         FROM public.action_legacy_stats_daily
        WHERE action_id = $1`,
      [fixture.productionV3ActionId],
    );
    expect(recent.rows).toEqual([{ unique_count: "1" }]);
  });

  it("flags history the backfill never covered", async () => {
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_missing_history",
      createdAt: daysAgoIso(7),
    });

    const mismatches = await readParityMismatches(pool);

    expect(mismatches).toEqual([
      {
        direction: "canonical_missing_or_mismatched",
        source: "legacy",
        action_id: fixture.productionV3ActionId,
        date_utc: utcDate(7),
        unique_count: "1",
      },
    ]);
  });

  it("flags corrupted v4 counts, then holds after re-rolling the range", async () => {
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
      id: "nullifier_v4_parity_mismatch",
      createdAt: daysAgoIso(7),
    });
    await rollupRange(utcDate(10), utcDate(1));

    const mismatches = await readParityMismatches(pool);
    expect(mismatches).toHaveLength(2);
    expect(mismatches.map((row) => row.direction).sort()).toEqual([
      "canonical_missing_or_mismatched",
      "rollup_extra_or_mismatched",
    ]);

    // The documented repair: re-POST (here: re-roll) the suspect range, no
    // reset step. The rebuild both recounts and sweeps.
    await removeParitySabotage();
    await rollupRange(utcDate(10), utcDate(1));

    expect(await readParityMismatches(pool)).toEqual([]);
    const rolled = await pool.query(
      `SELECT unique_count::text
         FROM public.action_v4_stats_daily
        WHERE action_v4_id = $1`,
      [fixture.productionV4ActionId],
    );
    expect(rolled.rows).toEqual([{ unique_count: "1" }]);
  });

  it("flags corrupted v3 counts", async () => {
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
      id: "nullifier_v3_parity_mismatch",
      createdAt: daysAgoIso(7),
    });
    await rollupRange(utcDate(10), utcDate(1));

    const mismatches = await readParityMismatches(pool);

    expect(mismatches).not.toEqual([]);
    expect(mismatches.every((row) => row.source === "legacy")).toBe(true);
  });

  it("catches rolled rows whose raw rows were deleted, healed by re-rolling", async () => {
    // A rolled day with no surviving raw rows: parity must flag it, and
    // re-rolling exactly that range must sweep it.
    await pool.query(
      `INSERT INTO public.action_legacy_stats_daily (
         action_id, date_utc, unique_count
       ) VALUES ($1, '2026-01-01', 5)`,
      [fixture.productionV3ActionId],
    );

    expect(await readParityMismatches(pool)).toEqual([
      {
        direction: "rollup_extra_or_mismatched",
        source: "legacy",
        action_id: fixture.productionV3ActionId,
        date_utc: "2026-01-01",
        unique_count: "5",
      },
    ]);

    await rollupRange("2026-01-01", "2026-01-01");

    expect(await readParityMismatches(pool)).toEqual([]);
    expect(await rolledRowCount()).toBe(0);
  });
});
// #endregion
