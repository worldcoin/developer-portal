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

const rollup = async (fromDate: string | null, toDate: string | null) => {
  const result = await pool.query<{ date_utc: string; unique_count: string }>(
    `SELECT date_utc::text, unique_count::text
       FROM public.rollup_world_id_analytics($1::date, $2::date)`,
    [fromDate, toDate],
  );
  return result.rows;
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

const insertStaleRolledRow = (dateUtc: string, count: number) =>
  pool.query(
    `INSERT INTO public.action_legacy_stats_daily (
       action_id, date_utc, unique_count
     ) VALUES ($1, $2, $3)`,
    [fixture.productionV3ActionId, dateUtc, count],
  );

const barrierLock: [number, number] = [812_404, 72];

const installPauseTrigger = async () => {
  await pool.query(`
    CREATE FUNCTION public.contract_pause_window_rollup()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      PERFORM pg_advisory_xact_lock(${barrierLock[0]}, ${barrierLock[1]});
      RETURN NEW;
    END
    $$;

    CREATE TRIGGER contract_pause_window_rollup
    BEFORE INSERT ON public.action_legacy_stats_daily
    FOR EACH ROW EXECUTE FUNCTION public.contract_pause_window_rollup();
  `);
};

const removePauseTrigger = async () => {
  await pool.query(`
    DROP TRIGGER IF EXISTS contract_pause_window_rollup
      ON public.action_legacy_stats_daily;
    DROP FUNCTION IF EXISTS public.contract_pause_window_rollup();
  `);
};

const waitForLockWaiter = async (
  predicateSql: string,
  values: Array<number | string>,
) => {
  for (let attempt = 0; attempt < 1_000; attempt += 1) {
    const result = await pool.query<{ waiting: boolean }>(predicateSql, values);
    if (result.rows[0].waiting) return;
  }
  throw new Error("never reached the deterministic lock barrier");
};

beforeAll(() => {
  if (process.env.WIA_FRESH_STACK !== "true") {
    throw new Error(
      "Run through the isolated World ID analytics fresh-stack harness",
    );
  }
});

beforeEach(async () => {
  await removePauseTrigger();
  await resetFixture(pool);
  await seedFixture(pool);
});

afterAll(async () => {
  await removePauseTrigger();
  await resetFixture(pool);
  await pool.end();
});

jest.setTimeout(150_000);

// #region Window semantics
describe("World ID analytics [window rollup]", () => {
  it("rebuilds only the trailing window when called without dates", async () => {
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_recent",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_old",
      createdAt: atUtc(3, 12, 0),
    });
    // A stale rolled day outside the window must survive untouched: the
    // default window never reaches back that far.
    await insertStaleRolledRow(utcDate(5), 9);

    const rolled = await rollup(null, null);

    expect(rolled.length).toBeGreaterThanOrEqual(1);
    const daily = await readLegacyDaily();
    expect(daily).toContainEqual({ date_utc: utcDate(5), unique_count: "9" });
    expect(daily).not.toContainEqual(
      expect.objectContaining({ date_utc: utcDate(3) }),
    );
    expect(
      daily
        .filter((row) => row.date_utc > utcDate(2))
        .reduce((sum, row) => sum + Number(row.unique_count), 0),
    ).toBe(1);
  });

  it("rebuilds exactly the inclusive dated range and nothing else", async () => {
    for (const [id, daysAgo, hours, minutes] of [
      ["nullifier_v3_range_ten", 10, 12, 0],
      ["nullifier_v3_range_nine_early", 9, 0, 30],
      ["nullifier_v3_range_nine_late", 9, 23, 30],
      ["nullifier_v3_range_eight", 8, 0, 30],
      ["nullifier_v3_range_seven", 7, 12, 0],
    ] as const) {
      await insertV3Nullifier(pool, {
        id,
        createdAt: atUtc(daysAgo, hours, minutes),
      });
    }

    const rolled = await rollup(utcDate(9), utcDate(8));

    expect(rolled).toEqual([
      { date_utc: utcDate(9), unique_count: "2" },
      { date_utc: utcDate(8), unique_count: "1" },
    ]);
    expect(await readLegacyDaily()).toEqual([
      { date_utc: utcDate(9), unique_count: "2" },
      { date_utc: utcDate(8), unique_count: "1" },
    ]);
  });

  it("combines both sources in the returned per-day totals", async () => {
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_combined_one",
      createdAt: atUtc(6, 9, 0),
    });
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_combined_two",
      createdAt: atUtc(6, 10, 0),
    });
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_combined",
      createdAt: atUtc(6, 11, 0),
    });

    const rolled = await rollup(utcDate(6), utcDate(6));

    expect(rolled).toEqual([{ date_utc: utcDate(6), unique_count: "3" }]);
    expect(await readV4Daily()).toEqual([
      { date_utc: utcDate(6), unique_count: "1" },
    ]);
  });

  it("never counts the racing five minutes even for a dated window", async () => {
    // Derive the settled row's UTC day from the row itself: right after UTC
    // midnight "now - 20 minutes" is still yesterday.
    const settledAt = new Date(Date.now() - 20 * 60 * 1000);
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_settled",
      createdAt: settledAt.toISOString(),
    });
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_racing",
      createdAt: new Date(Date.now() - 60 * 1000).toISOString(),
    });

    await rollup(utcDate(1), utcDate(0));

    expect(await readLegacyDaily()).toEqual([
      {
        date_utc: settledAt.toISOString().slice(0, 10),
        unique_count: "1",
      },
    ]);
  });

  it("returns the same result when the same window is rerun", async () => {
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_idempotent",
      createdAt: atUtc(4, 12, 0),
    });

    const first = await rollup(utcDate(4), utcDate(4));
    const second = await rollup(utcDate(4), utcDate(4));

    expect(second).toEqual(first);
    expect(await readLegacyDaily()).toEqual([
      { date_utc: utcDate(4), unique_count: "1" },
    ]);
  });

  it("sweeps rolled rows whose raw rows no longer exist", async () => {
    await insertStaleRolledRow(utcDate(6), 5);

    const rolled = await rollup(utcDate(6), utcDate(6));

    expect(rolled).toEqual([]);
    expect(await readLegacyDaily()).toEqual([]);
  });

  it("does nothing for a window entirely inside the unsafe zone", async () => {
    const tomorrow = utcMidnight(-1).toISOString().slice(0, 10);

    const rolled = await rollup(tomorrow, tomorrow);

    expect(rolled).toEqual([]);
  });

  it("rejects half-supplied and reversed windows", async () => {
    await expect(rollup(utcDate(3), null)).rejects.toThrow(
      "from_date and to_date must be supplied together",
    );
    await expect(rollup(utcDate(3), utcDate(5))).rejects.toThrow("is after");
  });

  it("lets a concurrent action deletion wait out a re-rolled window instead of deadlocking", async () => {
    // The deadlock precondition: the window already holds rolled rows, so
    // the run's child-row deletes lock something a deletion cascade wants.
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_deadlock_regression",
      createdAt: atUtc(6, 12, 0),
    });
    await rollup(utcDate(6), utcDate(6));
    await installPauseTrigger();

    const blocker = await pool.connect();
    const deleter = await pool.connect();
    try {
      await blocker.query("SELECT pg_advisory_lock($1, $2)", barrierLock);
      // The re-run pre-locks the parent, deletes the rolled rows, and pauses
      // at its first recount insert — exactly where the cycle used to form.
      const rerun = rollup(utcDate(6), utcDate(6));
      await waitForLockWaiter(
        `SELECT EXISTS (
           SELECT 1 FROM pg_locks
            WHERE locktype = 'advisory'
              AND classid::bigint = $1 AND objid::bigint = $2
              AND NOT granted
         ) AS waiting`,
        barrierLock,
      );

      await deleter.query("SET statement_timeout = '10s'");
      const deletion = deleter
        .query("DELETE FROM public.action WHERE id = $1", [
          fixture.productionV3ActionId,
        ])
        .then(
          (result) => ({ ok: true as const, rows: result.rowCount }),
          (error: { code?: string }) => ({
            ok: false as const,
            code: error.code,
          }),
        );
      // The deletion must be parked on the parent's KEY SHARE lock — not
      // deadlocked — while the rollup is still mid-transaction.
      await waitForLockWaiter(
        `SELECT EXISTS (
           SELECT 1 FROM pg_locks
            WHERE locktype = 'tuple' AND NOT granted
              AND relation = 'public.action'::regclass
         ) OR EXISTS (
           SELECT 1 FROM pg_stat_activity
            WHERE wait_event_type = 'Lock'
              AND query LIKE 'DELETE FROM public.action%'
         ) AS waiting`,
        [],
      );

      await blocker.query("SELECT pg_advisory_unlock($1, $2)", barrierLock);
      await expect(rerun).resolves.toEqual([
        { date_utc: utcDate(6), unique_count: "1" },
      ]);
      await expect(deletion).resolves.toEqual({ ok: true, rows: 1 });
      // The cascade swept the freshly rolled rows with the action.
      expect(await readLegacyDaily()).toEqual([]);
    } finally {
      await blocker.query("SELECT pg_advisory_unlock_all()");
      blocker.release();
      deleter.release();
    }
  });

  it("blocks behind a concurrent run instead of silently skipping", async () => {
    const holder = await pool.connect();
    const waiter = await pool.connect();

    try {
      await holder.query("BEGIN");
      await holder.query("SELECT pg_advisory_xact_lock($1, $2)", advisoryLock);

      await waiter.query("SET statement_timeout = '1500ms'");
      // Cancelled while *waiting* proves the call queues rather than erroring
      // or proceeding; the caller's request timeout is the real-world bound.
      await expect(
        waiter.query(
          `SELECT * FROM public.rollup_world_id_analytics($1::date, $2::date)`,
          [utcDate(3), utcDate(3)],
        ),
      ).rejects.toMatchObject({ code: "57014" });
    } finally {
      await holder.query("ROLLBACK").catch(() => undefined);
      holder.release();
      waiter.release();
    }

    await expect(rollup(utcDate(3), utcDate(3))).resolves.toEqual([]);
  });
});
// #endregion
