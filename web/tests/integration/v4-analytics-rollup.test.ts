import { Pool } from "pg";
import { integrationDBClean, integrationDBExecuteQuery } from "./setup";

// #region Test Data
const actionOne = "action_v4_analytics000000000000000000000001";
const actionTwo = "action_v4_analytics000000000000000000000002";

const seedActions = async () => {
  await integrationDBExecuteQuery(`
    INSERT INTO public.rp_registration
      (rp_id, app_id, mode, signer_address, status)
    SELECT
      'rp_analytics000001',
      id,
      'managed',
      '0x0000000000000000000000000000000000000001',
      'registered'
    FROM public.app
    ORDER BY id
    LIMIT 1;

    INSERT INTO public.rp_registration
      (rp_id, app_id, mode, signer_address, status)
    SELECT
      'rp_analytics000002',
      id,
      'managed',
      '0x0000000000000000000000000000000000000002',
      'registered'
    FROM public.app
    WHERE id <> (
      SELECT app_id
      FROM public.rp_registration
      WHERE rp_id = 'rp_analytics000001'
    )
    ORDER BY id
    LIMIT 1;

    INSERT INTO public.action_v4 (id, rp_id, action, environment)
    VALUES
      ('${actionOne}', 'rp_analytics000001', 'analytics-one', 'production'),
      ('${actionTwo}', 'rp_analytics000002', 'analytics-two', 'production');
  `);
};

const runRollup = () =>
  integrationDBExecuteQuery(
    "SELECT key, timestamp_value FROM public.rollup_v4_analytics()",
  );

const waitForLock = async (pool: Pool, pid: number) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const result = await pool.query(
      `SELECT wait_event_type FROM pg_stat_activity WHERE pid = $1`,
      [pid],
    );
    if (result.rows[0]?.wait_event_type === "Lock") return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error(`Backend ${pid} did not wait for a lock`);
};
// #endregion

beforeEach(async () => {
  await integrationDBClean();
  await seedActions();
});

// #region Canonical rebuild behavior
describe("rollup_v4_analytics [canonical rebuild]", () => {
  it("matches the canonical UTC action-day aggregation and latest timestamp", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.nullifier_v4
        (id, action_v4_id, nullifier, created_at)
      VALUES
        ('nullifier_v4_a1', '${actionOne}', 1001,
          date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
            - interval '1 second'),
        ('nullifier_v4_a2', '${actionOne}', 1002,
          date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
            + interval '1 second'),
        ('nullifier_v4_a3', '${actionOne}', 1003,
          now() - interval '2 days'),
        ('nullifier_v4_b1', '${actionTwo}', 1004,
          now() - interval '3 days');
    `);

    await runRollup();
    const comparison = await integrationDBExecuteQuery(`
      SELECT
        COALESCE(
          jsonb_agg(to_jsonb(actual) ORDER BY action_v4_id, date_utc),
          '[]'::jsonb
        ) = (
          SELECT COALESCE(
            jsonb_agg(to_jsonb(expected)
              ORDER BY action_v4_id, date_utc),
            '[]'::jsonb
          )
          FROM (
            SELECT
              action_v4_id,
              (created_at AT TIME ZONE 'UTC')::date AS date_utc,
              count(*)::bigint AS unique_count,
              max(created_at) AS latest_at
            FROM public.nullifier_v4
            WHERE created_at < now() - interval '5 minutes'
            GROUP BY 1, 2
          ) expected
        ) AS equal
      FROM public.action_v4_stats_daily actual;
    `);

    expect(comparison.rows[0].equal).toBe(true);
  });

  it("is unchanged after identical and overlapping reruns", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.nullifier_v4
        (id, action_v4_id, nullifier, created_at)
      VALUES ('nullifier_v4_rerun', '${actionOne}', 1005,
        now() - interval '2 days');
    `);
    await runRollup();
    const before = await integrationDBExecuteQuery(`
      SELECT jsonb_agg(to_jsonb(s) ORDER BY action_v4_id, date_utc) AS rows
      FROM public.action_v4_stats_daily s
    `);

    await runRollup();
    await integrationDBExecuteQuery(`
      UPDATE public.v4_analytics_state
      SET timestamp_value = now() - interval '1 hour'
      WHERE key = 'processed_through'
    `);
    await runRollup();
    const after = await integrationDBExecuteQuery(`
      SELECT jsonb_agg(to_jsonb(s) ORDER BY action_v4_id, date_utc) AS rows
      FROM public.action_v4_stats_daily s
    `);

    expect(after.rows[0].rows).toEqual(before.rows[0].rows);
  });

  it("captures a late commit within the rebuild horizon", async () => {
    await runRollup();
    await integrationDBExecuteQuery(`
      INSERT INTO public.nullifier_v4
        (id, action_v4_id, nullifier, created_at)
      VALUES ('nullifier_v4_late', '${actionOne}', 1006,
        now() - interval '23 hours');
    `);

    await runRollup();
    const result = await integrationDBExecuteQuery(`
      SELECT unique_count
      FROM public.action_v4_stats_daily
      WHERE action_v4_id = '${actionOne}'
        AND date_utc =
          ((now() - interval '23 hours') AT TIME ZONE 'UTC')::date
    `);

    expect(result.rows[0].unique_count).toBe("1");
  });

  it("excludes the five-minute cutoff and later includes the row", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.nullifier_v4
        (id, action_v4_id, nullifier, created_at)
      VALUES ('nullifier_v4_cutoff', '${actionOne}', 1007,
        now() - interval '4 minutes');
    `);
    await runRollup();
    let result = await integrationDBExecuteQuery(`
      SELECT count(*)::int AS count
      FROM public.action_v4_stats_daily
    `);
    expect(result.rows[0].count).toBe(0);

    await integrationDBExecuteQuery(`
      UPDATE public.nullifier_v4
      SET created_at = now() - interval '6 minutes'
      WHERE nullifier = 1007
    `);
    await runRollup();
    result = await integrationDBExecuteQuery(`
      SELECT count(*)::int AS count
      FROM public.action_v4_stats_daily
    `);
    expect(result.rows[0].count).toBe(1);
  });

  it("keeps old tampering in a bounded run and heals it on cold start", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.nullifier_v4
        (id, action_v4_id, nullifier, created_at)
      VALUES ('nullifier_v4_old', '${actionOne}', 1008,
        now() - interval '5 days');
    `);
    await runRollup();
    await integrationDBExecuteQuery(`
      UPDATE public.action_v4_stats_daily
      SET unique_count = 99
      WHERE action_v4_id = '${actionOne}'
    `);

    await runRollup();
    let result = await integrationDBExecuteQuery(`
      SELECT unique_count
      FROM public.action_v4_stats_daily
      WHERE action_v4_id = '${actionOne}'
    `);
    expect(result.rows[0].unique_count).toBe("99");

    await integrationDBExecuteQuery(`
      DELETE FROM public.v4_analytics_state
      WHERE key = 'processed_through'
    `);
    await runRollup();
    result = await integrationDBExecuteQuery(`
      SELECT unique_count
      FROM public.action_v4_stats_daily
      WHERE action_v4_id = '${actionOne}'
    `);
    expect(result.rows[0].unique_count).toBe("1");
  });
});
// #endregion

// #region Guards and invariants
describe("rollup_v4_analytics [guards]", () => {
  it("cold-starts empty and returns exactly one watermark row", async () => {
    const result = await runRollup();

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].key).toBe("processed_through");
    expect(
      await integrationDBExecuteQuery(
        "SELECT * FROM public.action_v4_stats_daily",
      ),
    ).toMatchObject({ rows: [] });
  });

  it("uses explicit UTC dates under a non-UTC session", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.nullifier_v4
        (id, action_v4_id, nullifier, created_at)
      VALUES
        ('nullifier_v4_midnight1', '${actionOne}', 1009,
          '2026-07-28 23:59:59+00'),
        ('nullifier_v4_midnight2', '${actionOne}', 1010,
          '2026-07-29 00:00:01+00');
      SET TIME ZONE 'America/Los_Angeles';
      SELECT * FROM public.rollup_v4_analytics();
    `);
    const result = await integrationDBExecuteQuery(`
      SELECT date_utc::text
      FROM public.action_v4_stats_daily
      ORDER BY date_utc
    `);

    expect(result.rows).toEqual([
      { date_utc: "2026-07-28" },
      { date_utc: "2026-07-29" },
    ]);
  });

  it("cascades action deletion without affecting sibling rows", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.nullifier_v4
        (id, action_v4_id, nullifier, created_at)
      VALUES
        ('nullifier_v4_delete1', '${actionOne}', 1011,
          now() - interval '1 day'),
        ('nullifier_v4_delete2', '${actionTwo}', 1012,
          now() - interval '1 day');
    `);
    await runRollup();
    await integrationDBExecuteQuery(
      `DELETE FROM public.action_v4 WHERE id = '${actionOne}'`,
    );
    await runRollup();
    const result = await integrationDBExecuteQuery(`
      SELECT DISTINCT action_v4_id
      FROM public.action_v4_stats_daily
    `);

    expect(result.rows).toEqual([{ action_v4_id: actionTwo }]);
  });

  it("surfaces 40P01 when deletion races the rollup lock order", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.nullifier_v4
        (id, action_v4_id, nullifier, created_at)
      VALUES ('nullifier_v4_deadlock', '${actionOne}', 1013,
        now() - interval '1 day');
    `);
    await runRollup();

    const pool = new Pool();
    const rollupClient = await pool.connect();
    const deleteClient = await pool.connect();

    try {
      await rollupClient.query("BEGIN");
      await rollupClient.query("SET LOCAL deadlock_timeout = '50ms'");
      await rollupClient.query(
        `DELETE FROM public.action_v4_stats_daily
         WHERE action_v4_id = $1`,
        [actionOne],
      );

      await deleteClient.query("BEGIN");
      await deleteClient.query("SET LOCAL deadlock_timeout = '5s'");
      const deletePid = (
        await deleteClient.query("SELECT pg_backend_pid() AS pid")
      ).rows[0].pid;
      const deletePromise = deleteClient.query(
        "DELETE FROM public.action_v4 WHERE id = $1",
        [actionOne],
      );
      await waitForLock(pool, deletePid);

      await expect(
        rollupClient.query(
          `INSERT INTO public.action_v4_stats_daily
             (action_v4_id, date_utc, unique_count, latest_at)
           VALUES ($1, CURRENT_DATE, 1, now())`,
          [actionOne],
        ),
      ).rejects.toMatchObject({ code: "40P01" });

      await rollupClient.query("ROLLBACK");
      await deletePromise;
      await deleteClient.query("COMMIT");
    } finally {
      await rollupClient.query("ROLLBACK").catch(() => undefined);
      await deleteClient.query("ROLLBACK").catch(() => undefined);
      rollupClient.release();
      deleteClient.release();
      await pool.end();
    }
  });

  it("keeps one monotone watermark across repeated runs", async () => {
    const first = await runRollup();
    const second = await runRollup();
    const state = await integrationDBExecuteQuery(`
      SELECT key, timestamp_value
      FROM public.v4_analytics_state
    `);

    expect(state.rows).toHaveLength(1);
    expect(state.rows[0].key).toBe("processed_through");
    expect(
      new Date(state.rows[0].timestamp_value).getTime(),
    ).toBeGreaterThanOrEqual(new Date(first.rows[0].timestamp_value).getTime());
    expect(state.rows[0].timestamp_value).toEqual(
      second.rows[0].timestamp_value,
    );
  });
});
// #endregion
