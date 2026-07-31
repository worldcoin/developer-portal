import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import {
  fixture,
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

const runBackfillAndValidate = () => {
  const repositoryRoot = requiredEnv("WIA_REPOSITORY_ROOT");
  const sql = readFileSync(
    path.join(
      repositoryRoot,
      "hasura/operations/world-id-analytics/backfill-and-validate.sql",
    ),
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

const commandOutput = (result: ReturnType<typeof runBackfillAndValidate>) =>
  `${result.stdout}\n${result.stderr}`;

const removeParitySabotage = async () => {
  await pool.query(`
    DROP TRIGGER IF EXISTS contract_corrupt_v4_analytics_rollup
      ON public.action_v4_stats_daily;
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
  it("runs the historical backfill, catch-up, and raw-v4 parity check", async () => {
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
        "Historical analytics backfill did not acquire the advisory lock",
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
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_gate_mismatch",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const result = runBackfillAndValidate();

    expect(result.status).not.toBe(0);
    expect(commandOutput(result)).toContain(
      "Raw-v4/rollup parity validation failed",
    );
  });
});
// #endregion
