import { Pool } from "pg";
import { fixture, resetFixture, seedFixture } from "./fresh-stack-fixture";

const pool = new Pool();

// Probe names, never the real indexes: the harness builds those at startup,
// the same way the platform team builds them manually before the rollout.
const CONCURRENT_PROBE = "nullifier_created_at_probe_idx";
const MIGRATION_PROBE = "nullifier_created_at_migration_probe_idx";

// Enough rows that the concurrent build spans many insert round trips, so the
// live-write assertion below is about real overlap rather than luck.
const BULK_ROWS = 60_000;

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

const atUtc = (daysAgo: number, hours: number) => {
  const date = utcMidnight(daysAgo);
  date.setUTCHours(hours, 0, 0, 0);
  return date.toISOString();
};

const utcDate = (daysAgo: number) =>
  utcMidnight(daysAgo).toISOString().slice(0, 10);

const dropProbeIndexes = async () => {
  for (const name of [CONCURRENT_PROBE, MIGRATION_PROBE]) {
    await pool.query(`DROP INDEX CONCURRENTLY IF EXISTS public.${name}`);
  }
};

const indexIsValid = async (name: string) => {
  const result = await pool.query<{ valid: boolean }>(
    `SELECT indisready AND indisvalid AS valid
       FROM pg_index
      WHERE indexrelid = to_regclass($1)
        AND indrelid = 'public.nullifier'::regclass`,
    [`public.${name}`],
  );
  return result.rows[0]?.valid ?? false;
};

const insertNullifier = (
  database: { query: Pool["query"] },
  input: { actionId: string; createdAt: string; id: string },
) =>
  database.query(
    `INSERT INTO public.nullifier (
       id, action_id, created_at, updated_at, nullifier_hash, uses
     ) VALUES ($1, $2, $3, $3, $4, 0)`,
    [input.id, input.actionId, input.createdAt, `hash_${input.id}`],
  );

const seedBulkNullifiers = async (count: number) => {
  await pool.query(
    `INSERT INTO public.nullifier (
       id, action_id, created_at, updated_at, nullifier_hash, uses
     )
     SELECT
       'nullifier_v3_bulk_' || g,
       $1,
       $2::timestamptz - (g * interval '1 second'),
       $2::timestamptz - (g * interval '1 second'),
       'hash_bulk_' || g,
       0
     FROM generate_series(1, $3::int) AS g`,
    [fixture.productionV3ActionId, atUtc(10, 12), count],
  );
};

beforeAll(() => {
  if (process.env.WIA_FRESH_STACK !== "true") {
    throw new Error(
      "Run through the isolated World ID analytics fresh-stack harness",
    );
  }
});

beforeEach(async () => {
  await dropProbeIndexes();
  await resetFixture(pool);
  await seedFixture(pool);
});

afterAll(async () => {
  await dropProbeIndexes();
  await resetFixture(pool);
  await pool.end();
});

jest.setTimeout(150_000);

// #region Why the index build cannot live in the migration
describe("World ID analytics [created_at index build]", () => {
  it("cannot be built concurrently inside a migration transaction", async () => {
    const client = await pool.connect();

    try {
      // Hasura wraps every migration in exactly this.
      await client.query("BEGIN");

      await expect(
        client.query(
          `CREATE INDEX CONCURRENTLY ${CONCURRENT_PROBE}
             ON public.nullifier (created_at)`,
        ),
      ).rejects.toMatchObject({ code: "25001" });
    } finally {
      await client.query("ROLLBACK").catch(() => undefined);
      client.release();
    }
  });

  it("blocks verification inserts when built the migration way instead", async () => {
    const builder = await pool.connect();
    const writer = await pool.connect();

    try {
      await builder.query("BEGIN");
      await builder.query(
        `CREATE INDEX ${MIGRATION_PROBE} ON public.nullifier (created_at)`,
      );

      // A verification arriving while the migration transaction is open. The
      // lock_timeout turns the wait into a deterministic failure instead of a
      // hang; in production this is a verification that stalls or 5xxs.
      await writer.query("SET lock_timeout = '250ms'");
      await expect(
        insertNullifier(writer, {
          actionId: fixture.productionV3ActionId,
          createdAt: atUtc(3, 9),
          id: "nullifier_v3_blocked_by_migration",
        }),
      ).rejects.toMatchObject({ code: "55P03" });
    } finally {
      await builder.query("ROLLBACK").catch(() => undefined);
      builder.release();
      writer.release();
    }
  });

  it("accepts verifications throughout a concurrent build and loses none", async () => {
    await seedBulkNullifiers(BULK_ROWS);

    const writer = await pool.connect();
    // Any lock conflict with the build fails the insert outright rather than
    // waiting, so a green run is proof the build never blocked a write.
    await writer.query("SET lock_timeout = '250ms'");

    let buildSettled = false;
    const build = pool
      .query(
        `CREATE INDEX CONCURRENTLY ${CONCURRENT_PROBE}
           ON public.nullifier (created_at)`,
      )
      .finally(() => {
        buildSettled = true;
      });

    const written: string[] = [];
    const writtenDuringBuild: string[] = [];
    const failures: string[] = [];

    try {
      while (!buildSettled) {
        const id = `nullifier_v3_live_${written.length + 1}`;
        try {
          await insertNullifier(writer, {
            actionId: fixture.secondProductionV3ActionId,
            createdAt: atUtc(4, 6),
            id,
          });
          written.push(id);
          if (!buildSettled) writtenDuringBuild.push(id);
        } catch (error) {
          failures.push(`${id}: ${String(error)}`);
          break;
        }
      }
      await build;
    } finally {
      writer.release();
    }

    expect(failures).toEqual([]);
    expect(writtenDuringBuild.length).toBeGreaterThanOrEqual(5);
    expect(await indexIsValid(CONCURRENT_PROBE)).toBe(true);

    // The second pass of a concurrent build has to pick up rows written while
    // the first pass was running. Prove it by rolling up and counting.
    await pool.query(
      "SELECT * FROM public.rollup_world_id_analytics($1::date, $1::date)",
      [utcDate(4)],
    );
    const rolled = await pool.query<{ unique_count: string }>(
      `SELECT unique_count::text
         FROM public.action_legacy_stats_daily
        WHERE action_id = $1 AND date_utc = $2::date`,
      [fixture.secondProductionV3ActionId, utcDate(4)],
    );

    expect(rolled.rows).toEqual([{ unique_count: String(written.length) }]);
  });
});
// #endregion
