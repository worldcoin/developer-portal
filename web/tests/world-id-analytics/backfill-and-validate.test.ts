import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import {
  fixture,
  insertV3Nullifier,
  insertV4Nullifier,
  resetFixture,
  seedFixture,
} from "./fresh-stack-fixture";

const pool = new Pool();
const advisoryLock: [number, number] = [533_214, 43];

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required by the fresh-stack harness`);
  return value;
};

const runSqlOperation = (filename: string) => {
  const repositoryRoot = requiredEnv("WIA_REPOSITORY_ROOT");
  const sql = readFileSync(
    path.join(repositoryRoot, "hasura/operations/world-id-analytics", filename),
    "utf8",
  );

  return spawnSync(
    "docker",
    [
      "compose",
      "--project-name",
      requiredEnv("WIA_COMPOSE_PROJECT"),
      "--file",
      requiredEnv("WIA_COMPOSE_FILE"),
      "exec",
      "--no-TTY",
      "postgres",
      "psql",
      "--username",
      "postgres",
      "--dbname",
      "postgres",
      "--no-psqlrc",
      "--set=ON_ERROR_STOP=1",
      "--file",
      "-",
    ],
    {
      encoding: "utf8",
      input: sql,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120_000,
    },
  );
};

const runBackfillAndValidate = () =>
  runSqlOperation("backfill-and-validate.sql");

const runCreateNullifierIndex = () =>
  runSqlOperation("create-nullifier-created-at-index.sql");

const commandOutput = (result: ReturnType<typeof runSqlOperation>) =>
  `${result.stdout}\n${result.stderr}`;

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
describe("World ID analytics [backfill and validation gate]", () => {
  it("rejects an invalid same-named concurrent index", async () => {
    const duplicateCreatedAt = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
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

      for (const result of [
        runCreateNullifierIndex(),
        runBackfillAndValidate(),
      ]) {
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

  it("fails before any backfill work when the v4 source index is missing", async () => {
    await pool.query(
      "DROP INDEX CONCURRENTLY public.nullifier_v4_created_at_idx",
    );

    try {
      const result = runBackfillAndValidate();

      expect(result.status).not.toBe(0);
      expect(commandOutput(result)).toContain(
        "nullifier_v4_created_at_idx is missing or invalid",
      );
      expect(
        (await pool.query("SELECT 1 FROM public.world_id_analytics_state"))
          .rows,
      ).toEqual([]);
    } finally {
      await pool.query(`
        CREATE INDEX CONCURRENTLY nullifier_v4_created_at_idx
          ON public.nullifier_v4 (created_at)
      `);
    }
  });

  it("runs the historical backfill, catch-up, and raw parity check", async () => {
    const createdAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_gate_success",
      createdAt: createdAt.toISOString(),
    });

    const result = runBackfillAndValidate();
    const output = commandOutput(result);

    expect({ error: result.error, output, status: result.status }).toEqual(
      expect.objectContaining({ error: undefined, status: 0 }),
    );
    expect(output).toContain("historical_backfill");
    expect(output).toContain("catch_up");

    const state = await pool.query<{ finite: boolean }>(
      `SELECT isfinite(processed_through) AS finite
         FROM public.world_id_analytics_state
        WHERE singleton`,
    );
    expect(state.rows).toEqual([{ finite: true }]);

    const rolled = await pool.query<{ unique_count: string }>(
      `SELECT unique_count::text
         FROM public.action_v4_stats_daily
        WHERE action_v4_id = $1
          AND date_utc = $2::timestamptz::date`,
      [fixture.productionV4ActionId, createdAt.toISOString()],
    );
    expect(rolled.rows).toEqual([{ unique_count: "1" }]);
  });

  it("fails when the historical backfill cannot acquire its advisory lock", async () => {
    const lockClient = await pool.connect();
    try {
      await lockClient.query("BEGIN");
      await lockClient.query(
        "SELECT pg_advisory_xact_lock($1, $2)",
        advisoryLock,
      );

      const result = runBackfillAndValidate();

      expect(result.status).not.toBe(0);
      expect(commandOutput(result)).toContain(
        "World ID analytics backfill did not acquire the advisory lock",
      );
    } finally {
      await lockClient.query("ROLLBACK");
      lockClient.release();
    }
  });

  it("fails when rolled v4 counts differ from the canonical raw rows", async () => {
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
    const createdAt = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_gate_mismatch",
      createdAt,
    });

    const result = runBackfillAndValidate();

    expect(result.status).not.toBe(0);
    expect(commandOutput(result)).toContain(
      "Raw/rollup parity validation failed",
    );

    const stateAfterFailure = await pool.query<{ finite: boolean }>(
      `SELECT isfinite(processed_through) AS finite
         FROM public.world_id_analytics_state
        WHERE singleton`,
    );
    expect(stateAfterFailure.rows).toEqual([{ finite: true }]);

    await removeParitySabotage();
    // The gate resumes from the committed watermark by design, so a parity
    // failure requires the runbook's full reset — truncate plus watermark —
    // before the retry.
    await pool.query(`
      TRUNCATE public.action_legacy_stats_daily, public.action_v4_stats_daily;
      UPDATE public.world_id_analytics_state
         SET processed_through = '-infinity' WHERE singleton;
    `);

    const retry = runBackfillAndValidate();
    expect({
      error: retry.error,
      output: commandOutput(retry),
      status: retry.status,
    }).toEqual(expect.objectContaining({ error: undefined, status: 0 }));

    const rolled = await pool.query<{ unique_count: string }>(
      `SELECT unique_count::text
         FROM public.action_v4_stats_daily
        WHERE action_v4_id = $1
          AND date_utc = $2::timestamptz::date`,
      [fixture.productionV4ActionId, createdAt],
    );
    expect(rolled.rows).toEqual([{ unique_count: "1" }]);
  });

  it("clears rolled-only rows through the documented full reset", async () => {
    // A rolled row whose raw rows were later deleted, dated before the
    // oldest surviving raw row: capped rebuilds anchor at that oldest raw
    // row, so no watermark reset alone can ever sweep it.
    await pool.query(
      `INSERT INTO public.action_legacy_stats_daily (
         action_id, date_utc, unique_count
       ) VALUES ($1, '2026-01-01', 5)`,
      [fixture.productionV3ActionId],
    );
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_reset_survivor",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const withoutReset = runBackfillAndValidate();
    expect(withoutReset.status).not.toBe(0);
    expect(commandOutput(withoutReset)).toContain(
      "Raw/rollup parity validation failed",
    );

    await pool.query(`
      TRUNCATE public.action_legacy_stats_daily, public.action_v4_stats_daily;
      UPDATE public.world_id_analytics_state
         SET processed_through = '-infinity' WHERE singleton;
    `);

    const retry = runBackfillAndValidate();
    expect({
      error: retry.error,
      output: commandOutput(retry),
      status: retry.status,
    }).toEqual(expect.objectContaining({ error: undefined, status: 0 }));

    const stale = await pool.query(
      `SELECT 1
         FROM public.action_legacy_stats_daily
        WHERE date_utc = '2026-01-01'`,
    );
    expect(stale.rows).toEqual([]);
  });

  it("fails when rolled v3 counts differ from the canonical raw rows", async () => {
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
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const result = runBackfillAndValidate();

    expect(result.status).not.toBe(0);
    expect(commandOutput(result)).toContain(
      "Raw/rollup parity validation failed",
    );
  });
});
// #endregion
