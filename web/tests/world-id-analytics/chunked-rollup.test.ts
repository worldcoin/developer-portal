import { Pool } from "pg";
import {
  insertV3Nullifier,
  insertV4Nullifier,
  resetFixture,
  seedFixture,
} from "./fresh-stack-fixture";

const pool = new Pool();

const utcMidnight = (daysAgo: number) => {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - daysAgo,
    ),
  );
};

const atUtc = (daysAgo: number, hours: number, minutes: number) => {
  const date = utcMidnight(daysAgo);
  date.setUTCHours(hours, minutes, 0, 0);
  return date.toISOString();
};

const utcDate = (daysAgo: number) =>
  utcMidnight(daysAgo).toISOString().slice(0, 10);

const rollup = async (cap: number | null) => {
  const result = await pool.query<{ processed_through: string }>(
    `SELECT processed_through::text
       FROM public.rollup_world_id_analytics($1::integer)`,
    [cap],
  );
  return result.rows;
};

const watermarkEquals = async (expression: string, value: string) => {
  const result = await pool.query<{ matches: boolean }>(
    `SELECT processed_through = (${expression}) AS matches
       FROM public.world_id_analytics_state
      WHERE singleton`,
    [value],
  );
  return result.rows[0]?.matches ?? null;
};

const watermarkCaughtUp = async () => {
  const result = await pool.query<{ caught_up: boolean }>(
    `SELECT processed_through >= now() - interval '6 minutes' AS caught_up
       FROM public.world_id_analytics_state
      WHERE singleton`,
  );
  return result.rows[0]?.caught_up ?? null;
};

const readLegacyDaily = async () =>
  (
    await pool.query<{ date_utc: string; unique_count: string }>(
      `SELECT date_utc::text, unique_count::text
         FROM public.action_legacy_stats_daily
        ORDER BY date_utc`,
    )
  ).rows;

const readV4Daily = async () =>
  (
    await pool.query<{ date_utc: string; unique_count: string }>(
      `SELECT date_utc::text, unique_count::text
         FROM public.action_v4_stats_daily
        ORDER BY date_utc`,
    )
  ).rows;

const removeChunkSabotage = async () => {
  await pool.query(`
    DROP TRIGGER IF EXISTS contract_fail_v3_analytics_chunk
      ON public.action_legacy_stats_daily;
    DROP FUNCTION IF EXISTS public.contract_fail_v3_analytics_chunk();
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
  await removeChunkSabotage();
  await resetFixture(pool);
  await seedFixture(pool);
});

afterAll(async () => {
  await removeChunkSabotage();
  await resetFixture(pool);
  await pool.end();
});

jest.setTimeout(150_000);

// #region Advance cap
describe("World ID analytics [rollup advance cap]", () => {
  it("advances one whole UTC day per capped call without gaps", async () => {
    for (const [id, daysAgo] of [
      ["nullifier_v3_cap_day_ten", 10],
      ["nullifier_v3_cap_day_nine", 9],
      ["nullifier_v3_cap_day_eight", 8],
    ] as const) {
      await insertV3Nullifier(pool, { id, createdAt: atUtc(daysAgo, 12, 0) });
    }

    const firstChunk = await rollup(1);
    expect(firstChunk).toHaveLength(1);
    expect(
      await watermarkEquals(
        `($1::date + 1)::timestamp AT TIME ZONE 'UTC'`,
        utcDate(10),
      ),
    ).toBe(true);
    expect(await readLegacyDaily()).toEqual([
      { date_utc: utcDate(10), unique_count: "1" },
    ]);

    await rollup(1);
    expect(
      await watermarkEquals(
        `($1::date + 1)::timestamp AT TIME ZONE 'UTC'`,
        utcDate(9),
      ),
    ).toBe(true);
    expect(await readLegacyDaily()).toEqual([
      { date_utc: utcDate(10), unique_count: "1" },
      { date_utc: utcDate(9), unique_count: "1" },
    ]);

    await pool.query("CALL public.backfill_world_id_analytics(1)");
    expect(await watermarkCaughtUp()).toBe(true);
    expect(await readLegacyDaily()).toEqual([
      { date_utc: utcDate(10), unique_count: "1" },
      { date_utc: utcDate(9), unique_count: "1" },
      { date_utc: utcDate(8), unique_count: "1" },
    ]);
  });

  it("keeps the uncapped call a single full-history rebuild", async () => {
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_uncapped_old",
      createdAt: atUtc(30, 12, 0),
    });
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_uncapped_recent",
      createdAt: atUtc(2, 12, 0),
    });

    const result = await rollup(null);

    expect(result).toHaveLength(1);
    expect(await watermarkCaughtUp()).toBe(true);
    expect(await readLegacyDaily()).toEqual([
      { date_utc: utcDate(30), unique_count: "1" },
      { date_utc: utcDate(2), unique_count: "1" },
    ]);
  });

  it("anchors the bootstrap chunk at the oldest row across both sources", async () => {
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_bootstrap_oldest",
      createdAt: atUtc(12, 12, 0),
    });
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_bootstrap_newer",
      createdAt: atUtc(5, 12, 0),
    });

    await rollup(1);

    expect(
      await watermarkEquals(
        `($1::date + 1)::timestamp AT TIME ZONE 'UTC'`,
        utcDate(12),
      ),
    ).toBe(true);
    expect(await readV4Daily()).toEqual([
      { date_utc: utcDate(12), unique_count: "1" },
    ]);
    expect(await readLegacyDaily()).toEqual([]);
  });

  it("terminates immediately on an empty database", async () => {
    const result = await rollup(1);

    expect(result).toHaveLength(1);
    expect(await watermarkCaughtUp()).toBe(true);
    expect(await readLegacyDaily()).toEqual([]);
    expect(await readV4Daily()).toEqual([]);
  });

  it("counts rows straddling a chunk boundary exactly once", async () => {
    for (const [id, daysAgo, hours, minutes] of [
      ["nullifier_v3_boundary_early", 7, 0, 30],
      ["nullifier_v3_boundary_late", 7, 23, 30],
      ["nullifier_v3_boundary_next", 6, 0, 30],
    ] as const) {
      await insertV3Nullifier(pool, {
        id,
        createdAt: atUtc(daysAgo, hours, minutes),
      });
    }

    await pool.query("CALL public.backfill_world_id_analytics(1)");

    expect(await watermarkCaughtUp()).toBe(true);
    expect(await readLegacyDaily()).toEqual([
      { date_utc: utcDate(7), unique_count: "2" },
      { date_utc: utcDate(6), unique_count: "1" },
    ]);
  });

  it("rejects a non-positive cap and chunk size", async () => {
    await expect(rollup(0)).rejects.toThrow(
      "max_advance_days must be NULL or at least 1",
    );
    await expect(
      pool.query("CALL public.backfill_world_id_analytics(0)"),
    ).rejects.toThrow("chunk_days must be at least 1");
  });
});
// #endregion

// #region Resumability
describe("World ID analytics [backfill resumability]", () => {
  it("keeps committed chunks when a later chunk fails, then resumes", async () => {
    for (const [id, daysAgo] of [
      ["nullifier_v3_resume_day_ten", 10],
      ["nullifier_v3_resume_day_nine", 9],
      ["nullifier_v3_resume_day_eight", 8],
    ] as const) {
      await insertV3Nullifier(pool, { id, createdAt: atUtc(daysAgo, 12, 0) });
    }
    await pool.query(`
      CREATE FUNCTION public.contract_fail_v3_analytics_chunk()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF NEW.date_utc = '${utcDate(8)}'::date THEN
          RAISE EXCEPTION 'chunk sabotage';
        END IF;
        RETURN NEW;
      END
      $$;

      CREATE TRIGGER contract_fail_v3_analytics_chunk
      BEFORE INSERT ON public.action_legacy_stats_daily
      FOR EACH ROW
      EXECUTE FUNCTION public.contract_fail_v3_analytics_chunk();
    `);

    await expect(
      pool.query("CALL public.backfill_world_id_analytics(1)"),
    ).rejects.toThrow("chunk sabotage");

    expect(await readLegacyDaily()).toEqual([
      { date_utc: utcDate(10), unique_count: "1" },
      { date_utc: utcDate(9), unique_count: "1" },
    ]);
    expect(
      await watermarkEquals(
        `$1::date::timestamp AT TIME ZONE 'UTC'`,
        utcDate(8),
      ),
    ).toBe(true);

    await removeChunkSabotage();
    await pool.query("CALL public.backfill_world_id_analytics(1)");

    expect(await watermarkCaughtUp()).toBe(true);
    expect(await readLegacyDaily()).toEqual([
      { date_utc: utcDate(10), unique_count: "1" },
      { date_utc: utcDate(9), unique_count: "1" },
      { date_utc: utcDate(8), unique_count: "1" },
    ]);
  });
});
// #endregion
