import { POST as rollupWorldIdAnalytics } from "@/api/_rollup-world-id-analytics";
import { GET as getWorldIdAnalytics } from "@/api/portal/apps/[app_id]/world-id-analytics";
import { generateServiceJWT, generateUserJWT } from "@/api/helpers/jwts";
import { NextRequest } from "next/server";
import { Pool, type PoolClient } from "pg";
import { normalizeAnalyticsResponse } from "../contracts/world-id-analytics-endpoint";
import {
  readCanonicalSourceDaily,
  readRolledSourceDaily,
  toAppDailyRows,
  toLifetimeRows,
} from "./canonical-analytics";
import {
  fixture,
  insertV3Nullifier,
  insertV4Nullifier,
  resetFixture,
  seedFixture,
} from "./fresh-stack-fixture";

// #region Mocks
const getIsUserAllowedToReadApp = jest.fn();

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// This is the sole mocked application boundary. GraphQL clients, generated
// operations, PostgreSQL, migrations, and Hasura metadata remain real.
jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToReadApp: (...args: unknown[]) =>
    getIsUserAllowedToReadApp(...args),
}));
// #endregion

// #region Test Data
const pool = new Pool({ max: 12 });
const barrierLock: [number, number] = [812_404, 71];

type DailyRow = {
  action_id?: string;
  action_v4_id?: string;
  date_utc: string;
  unique_count: string;
};

const callRollup = async () => {
  const response = await rollupWorldIdAnalytics(
    new NextRequest("http://localhost:3000/api/_rollup-world-id-analytics", {
      method: "POST",
      headers: {
        authorization: process.env.INTERNAL_ENDPOINTS_SECRET as string,
      },
    }),
  );
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `rollup failed (${response.status}): ${JSON.stringify(body)}`,
    );
  }
  return body;
};

const callEndpoint = async (input?: {
  actionIds?: string[];
  appId?: string;
  environment?: "production" | "staging";
  period?: "all_time" | "last_7_days";
}) => {
  const appId = input?.appId ?? fixture.productionAppId;
  const search = new URLSearchParams({
    environment: input?.environment ?? "production",
    period: input?.period ?? "all_time",
  });
  if (input?.actionIds) {
    search.set("action_ids", input.actionIds.join(","));
  }
  return getWorldIdAnalytics(
    new NextRequest(
      `http://localhost:3000/api/portal/apps/${appId}/world-id-analytics?${search}`,
    ),
    { params: Promise.resolve({ app_id: appId }) },
  );
};

const endpointBody = async (input?: Parameters<typeof callEndpoint>[0]) => {
  const response = await callEndpoint(input);
  expect(response.status).toBe(200);
  return normalizeAnalyticsResponse(await response.json());
};

const getDailyRows = async (
  table: "action_legacy_stats_daily" | "action_v4_stats_daily",
  actionId: string,
) => {
  const column =
    table === "action_legacy_stats_daily" ? "action_id" : "action_v4_id";
  const result = await pool.query<DailyRow>(
    `SELECT ${column}, date_utc::text, unique_count::text
       FROM public.${table}
      WHERE ${column} = $1
      ORDER BY date_utc`,
    [actionId],
  );
  return result.rows;
};

const pointMap = (series: Array<{ count: string; date: string }>) =>
  new Map(series.map((point) => [point.date, point.count]));

const installPauseTrigger = async () => {
  await pool.query(
    `CREATE FUNCTION public.contract_pause_analytics_rollup()
     RETURNS trigger LANGUAGE plpgsql AS $$
     BEGIN
       PERFORM pg_advisory_xact_lock(${barrierLock[0]}, ${barrierLock[1]});
       RETURN NEW;
     END
     $$`,
  );
  await pool.query(
    `CREATE TRIGGER contract_pause_analytics_rollup
     BEFORE INSERT ON public.action_legacy_stats_daily
     FOR EACH ROW EXECUTE FUNCTION public.contract_pause_analytics_rollup()`,
  );
};

const waitForBarrierWaiter = async () => {
  for (let attempt = 0; attempt < 1_000; attempt += 1) {
    const result = await pool.query<{ waiting: boolean }>(
      `SELECT EXISTS (
         SELECT 1
           FROM pg_locks
          WHERE locktype = 'advisory'
            AND classid::bigint = $1
            AND objid::bigint = $2
            AND NOT granted
       ) AS waiting`,
      barrierLock,
    );
    if (result.rows[0].waiting) return;
  }
  throw new Error("rollup never reached deterministic advisory-lock barrier");
};

const releaseBarrier = async (client: PoolClient) => {
  await client.query("SELECT pg_advisory_unlock($1, $2)", barrierLock);
};

const graphRequest = async (input: {
  headers?: Record<string, string>;
  query: string;
}) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_GRAPHQL_API_URL as string,
    {
      method: "POST",
      headers: { "content-type": "application/json", ...input.headers },
      body: JSON.stringify({ query: input.query }),
    },
  );
  return {
    status: response.status,
    body: (await response.json()) as {
      data?: Record<string, unknown>;
      errors?: Array<{ message: string }>;
    },
  };
};

const readRoleSchema = async (headers?: Record<string, string>) => {
  const response = await graphRequest({
    headers,
    query: `query AnalyticsRoleSchema {
      __schema {
        queryType { fields { name } }
        mutationType { fields { name } }
        types { name }
      }
    }`,
  });
  expect(response.status).toBe(200);
  expect(response.body.errors).toBeUndefined();
  const schema = response.body.data?.__schema as
    | {
        mutationType?: { fields: Array<{ name: string }> } | null;
        queryType: { fields: Array<{ name: string }> };
        types: Array<{ name: string }>;
      }
    | undefined;
  expect(schema).toBeDefined();
  return {
    roots: new Set([
      ...(schema?.queryType.fields.map((field) => field.name) ?? []),
      ...(schema?.mutationType?.fields.map((field) => field.name) ?? []),
    ]),
    types: new Set(schema?.types.map((type) => type.name) ?? []),
  };
};
// #endregion

beforeAll(async () => {
  if (process.env.WIA_FRESH_STACK !== "true") {
    throw new Error(
      "Run through pnpm test:world-id-analytics:fresh; shared stacks are forbidden",
    );
  }
  await pool.query("CREATE EXTENSION IF NOT EXISTS pg_stat_statements");
});

beforeEach(async () => {
  getIsUserAllowedToReadApp.mockReset();
  getIsUserAllowedToReadApp.mockResolvedValue(true);
  await pool.query(`
    DO $$
    BEGIN
      IF to_regclass('public.action_legacy_stats_daily') IS NOT NULL THEN
        DROP TRIGGER IF EXISTS contract_pause_analytics_rollup
          ON public.action_legacy_stats_daily;
      END IF;
      IF to_regclass('public.action_v4_stats_daily') IS NOT NULL THEN
        DROP TRIGGER IF EXISTS contract_fail_v4_analytics_rollup
          ON public.action_v4_stats_daily;
      END IF;
      DROP FUNCTION IF EXISTS public.contract_pause_analytics_rollup();
      DROP FUNCTION IF EXISTS public.contract_fail_v4_analytics_rollup();
    END
    $$;
  `);
  await resetFixture(pool);
  await seedFixture(pool);
});

afterAll(async () => {
  await resetFixture(pool);
  await pool.end();
});

// #region Cold backfill, canonical parity, and endpoint payload
describe("World ID analytics [real cold backfill and endpoint]", () => {
  it("counts canonical v3/v4 rows once by UTC, sums apps, and isolates environments", async () => {
    await pool.query("SET TIME ZONE 'America/Los_Angeles'");
    await insertV3Nullifier(pool, {
      id: "nil_contract_utc_before",
      createdAt: "2026-01-09T23:59:59.999Z",
      uses: 0,
    });
    await insertV3Nullifier(pool, {
      id: "nil_contract_utc_after",
      createdAt: "2026-01-10T00:00:00.000Z",
      uses: 8,
    });
    await insertV3Nullifier(pool, {
      id: "nil_contract_second_action",
      actionId: fixture.secondProductionV3ActionId,
      createdAt: "2026-01-10T03:00:00.000Z",
      uses: 1,
    });
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_contract_utc_before",
      createdAt: "2026-01-09T23:59:59.999Z",
    });
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_contract_utc_after",
      createdAt: "2026-01-10T00:00:00.000Z",
    });
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_contract_second_action",
      actionId: fixture.secondProductionV4ActionId,
      createdAt: "2026-01-10T03:00:00.000Z",
    });
    await insertV3Nullifier(pool, {
      id: "nil_contract_staging",
      actionId: fixture.stagingV3ActionId,
      createdAt: "2026-01-10T03:00:00.000Z",
    });
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_contract_staging",
      actionId: fixture.stagingV4ActionId,
      createdAt: "2026-01-10T03:00:00.000Z",
    });
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_contract_production_app_staging",
      actionId: fixture.productionStagingV4ActionId,
      createdAt: "2026-01-10T03:00:00.000Z",
    });
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_contract_staging_app_production",
      actionId: fixture.stagingProductionV4ActionId,
      createdAt: "2026-01-10T03:00:00.000Z",
    });

    await expect(callRollup()).resolves.toEqual({
      success: true,
      outcome: "advanced",
      processed_through: expect.any(String),
    });

    expect(
      await getDailyRows(
        "action_legacy_stats_daily",
        fixture.productionV3ActionId,
      ),
    ).toEqual([
      {
        action_id: fixture.productionV3ActionId,
        date_utc: "2026-01-09",
        unique_count: "1",
      },
      {
        action_id: fixture.productionV3ActionId,
        date_utc: "2026-01-10",
        unique_count: "1",
      },
    ]);
    expect(
      await getDailyRows("action_v4_stats_daily", fixture.productionV4ActionId),
    ).toEqual([
      {
        action_v4_id: fixture.productionV4ActionId,
        date_utc: "2026-01-09",
        unique_count: "1",
      },
      {
        action_v4_id: fixture.productionV4ActionId,
        date_utc: "2026-01-10",
        unique_count: "1",
      },
    ]);

    const productionSelected = await endpointBody();
    const productionSelectedPoints = pointMap(productionSelected.app.series);
    expect(productionSelectedPoints.get("2026-01-09")).toBe("2");
    expect(productionSelectedPoints.get("2026-01-10")).toBe("4");

    const stagingSelectedForProductionApp = await endpointBody({
      environment: "staging",
    });
    expect(
      pointMap(stagingSelectedForProductionApp.app.series).get("2026-01-10"),
    ).toBe("1");

    const stagingSelected = await endpointBody({
      appId: fixture.stagingAppId,
      environment: "staging",
    });
    expect(pointMap(stagingSelected.app.series).get("2026-01-10")).toBe("2");

    const productionSelectedForStagingApp = await endpointBody({
      appId: fixture.stagingAppId,
      environment: "production",
    });
    expect(
      pointMap(productionSelectedForStagingApp.app.series).get("2026-01-10"),
    ).toBe("1");
  });

  it("returns a zero-filled app series and requested action blocks without raw-table reads", async () => {
    await insertV3Nullifier(pool, {
      id: "nil_contract_endpoint",
      createdAt: "2026-01-10T12:00:00.000Z",
    });
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_contract_endpoint",
      createdAt: "2026-01-12T12:00:00.000Z",
    });
    await callRollup();
    await pool.query("SELECT pg_stat_statements_reset()");

    const response = await callEndpoint({
      actionIds: [fixture.productionV3ActionId, fixture.productionV4ActionId],
    });
    expect(response.status).toBe(200);
    const rawBody = await response.json();
    const body = normalizeAnalyticsResponse(rawBody);

    expect(body.period).toBe("all_time");
    expect(body.app.count).toBe("2");
    expect(pointMap(body.app.series).get("2026-01-11")).toBe("0");
    expect(body.legacyActions).toEqual([
      expect.objectContaining({
        id: fixture.productionV3ActionId,
        count: "1",
      }),
    ]);
    expect(body.actions).toEqual([
      expect.objectContaining({
        id: fixture.productionV4ActionId,
        count: "1",
      }),
    ]);
    expect(JSON.stringify(rawBody)).not.toMatch(
      /session|team|reuse|uses|latest|stale|watermark|human/i,
    );

    const statements = await pool.query<{ query: string }>(
      `SELECT query
         FROM pg_stat_statements
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
          AND (
            query ILIKE '%stats_daily%'
            OR query ILIKE '%world_id%'
            OR query ILIKE '%nullifier%'
          )`,
    );
    const endpointSql = statements.rows.map((row) => row.query).join("\n");
    expect(endpointSql).not.toMatch(
      /\bFROM\s+(?:"?public"?\.)?"?nullifier(?:_v4)?"?\b/i,
    );
    expect(endpointSql).toMatch(/stats_daily|world_id.*daily/i);
  });

  it("rejects wrong-source and wrong-environment action ids against the real database", async () => {
    for (const [actionId, environment] of [
      [fixture.productionV3ActionId, "staging"],
      [fixture.stagingV4ActionId, "production"],
    ] as const) {
      const response = await callEndpoint({
        appId:
          actionId === fixture.productionV3ActionId
            ? fixture.productionAppId
            : fixture.stagingAppId,
        actionIds: [actionId],
        environment,
      });
      expect(response.status).toBe(400);
    }

    // productionV4ActionId shares its hex body with productionV3ActionId, so
    // strip a v4 id whose body has no v3 counterpart.
    const sourceMismatched = fixture.productionStagingV4ActionId.replace(
      "action_v4_",
      "action_",
    );
    expect(
      (
        await callEndpoint({
          actionIds: [sourceMismatched],
        })
      ).status,
    ).toBe(400);
  });

  it("uses app creation for v3-only All Time and RP creation for v4-only All Time", async () => {
    await insertV3Nullifier(pool, {
      id: "nil_contract_v3_only_start",
      actionId: fixture.v3OnlyActionId,
      createdAt: "2026-01-05T12:00:00.000Z",
    });
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_contract_v4_only_start",
      actionId: fixture.v4OnlyActionId,
      createdAt: "2026-01-05T12:00:00.000Z",
    });
    await callRollup();

    const v3Only = await endpointBody({ appId: fixture.v3OnlyAppId });
    const v4Only = await endpointBody({ appId: fixture.v4OnlyAppId });

    expect(v3Only.app.series[0].date).toBe("2026-01-01");
    expect(v4Only.app.series[0].date).toBe("2026-01-03");
  });

  it("matches independent canonical daily and lifetime results for every seeded app, action, source, and environment", async () => {
    const v3Actions = [
      fixture.productionV3ActionId,
      fixture.secondProductionV3ActionId,
      fixture.stagingV3ActionId,
      fixture.v3OnlyActionId,
    ];
    const v4Actions = [
      fixture.productionV4ActionId,
      fixture.secondProductionV4ActionId,
      fixture.stagingV4ActionId,
      fixture.v4OnlyActionId,
      fixture.productionStagingV4ActionId,
      fixture.stagingProductionV4ActionId,
    ];

    for (const [index, actionId] of v3Actions.entries()) {
      for (const day of [8, 9]) {
        await insertV3Nullifier(pool, {
          id: `nil_contract_parity_v3_${index}_${day}`,
          actionId,
          createdAt: `2026-01-${day.toString().padStart(2, "0")}T${(10 + index)
            .toString()
            .padStart(2, "0")}:00:00.000Z`,
          uses: (index + day) % 9,
        });
      }
    }
    for (const [index, actionId] of v4Actions.entries()) {
      for (const day of [8, 9]) {
        await insertV4Nullifier(pool, {
          id: `nullifier_v4_contract_parity_${index}_${day}`,
          actionId,
          createdAt: `2026-01-${day.toString().padStart(2, "0")}T${(10 + index)
            .toString()
            .padStart(2, "0")}:30:00.000Z`,
        });
      }
    }

    const canonical = await readCanonicalSourceDaily(pool, fixture.teamId);
    await callRollup();
    const rolled = await readRolledSourceDaily(pool, fixture.teamId);

    expect(rolled).toEqual(canonical);
    expect(toLifetimeRows(rolled)).toEqual(toLifetimeRows(canonical));
    expect(toAppDailyRows(rolled)).toEqual(toAppDailyRows(canonical));

    const canonicalAppDaily = toAppDailyRows(canonical);
    for (const appId of [
      fixture.productionAppId,
      fixture.stagingAppId,
      fixture.v3OnlyAppId,
      fixture.v4OnlyAppId,
    ]) {
      for (const environment of ["production", "staging"] as const) {
        const expected = canonicalAppDaily.filter(
          (row) => row.app_id === appId && row.environment === environment,
        );
        const endpoint = await endpointBody({ appId, environment });
        const nonZero = endpoint.app.series
          .filter((point) => point.count !== "0")
          .map((point) => ({
            app_id: appId,
            environment,
            date_utc: point.date,
            count: point.count,
          }));

        expect(nonZero).toEqual(expected);
        expect(endpoint.app.count).toBe(
          expected
            .reduce((total, row) => total + BigInt(row.count), 0n)
            .toString(),
        );
      }
    }
  });
});
// #endregion

// #region Rebuild, catch-up, cutoff, and mutable v3 fields
describe("World ID analytics [real rebuild and catch-up]", () => {
  it("runs a full dual-source cold backfill, an identical rerun, and an absolute overlap refresh", async () => {
    // Anchors stay inside the ~25-hour rebuild overlap behind the watermark;
    // a bounded-window rollup never revisits dates older than that.
    const anchors = await pool.query<{ cold_at: string; late_at: string }>(
      `SELECT
         (clock_timestamp() - INTERVAL '3 hours')::text AS cold_at,
         (clock_timestamp() - INTERVAL '2 hours')::text AS late_at`,
    );
    const { cold_at, late_at } = anchors.rows[0];
    const total = (rows: Array<{ count: string }>) =>
      rows.reduce((sum, row) => sum + BigInt(row.count), 0n);

    await insertV3Nullifier(pool, {
      id: "nil_contract_cold_v3",
      createdAt: cold_at,
      uses: 3,
    });
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_contract_cold_v4",
      createdAt: cold_at,
    });

    await callRollup();
    const first = await readRolledSourceDaily(pool, fixture.teamId);
    expect(first).toEqual(await readCanonicalSourceDaily(pool, fixture.teamId));

    await callRollup();
    expect(await readRolledSourceDaily(pool, fixture.teamId)).toEqual(first);

    // A row committing late — behind the watermark but inside the overlap —
    // is recaptured by the next absolute rebuild, never added incrementally.
    await insertV3Nullifier(pool, {
      id: "nil_contract_overlap_late",
      createdAt: late_at,
      uses: 0,
    });
    await callRollup();
    const refreshed = await readRolledSourceDaily(pool, fixture.teamId);
    expect(refreshed).toEqual(
      await readCanonicalSourceDaily(pool, fixture.teamId),
    );
    expect(total(refreshed) - total(first)).toBe(1n);
  });

  it("does not move or multiply a v3 point when uses and updated_at change", async () => {
    await insertV3Nullifier(pool, {
      id: "nil_contract_mutable_fields",
      createdAt: "2026-01-10T10:00:00.000Z",
      updatedAt: "2026-01-10T10:00:00.000Z",
      uses: 0,
    });
    await callRollup();
    await pool.query(
      `UPDATE public.nullifier
          SET uses = 50, updated_at = '2026-06-01T10:00:00Z'
        WHERE id = 'nil_contract_mutable_fields'`,
    );
    await callRollup();

    expect(
      await getDailyRows(
        "action_legacy_stats_daily",
        fixture.productionV3ActionId,
      ),
    ).toEqual([
      {
        action_id: fixture.productionV3ActionId,
        date_utc: "2026-01-10",
        unique_count: "1",
      },
    ]);
  });

  it("uses one run cutoff and catches a row inserted after the v3 scan on the next run", async () => {
    // Totals are summed across dates so a run straddling UTC midnight cannot
    // split the two rows onto different date_utc rows and flake.
    const anchors = await pool.query<{ initial_at: string; late_at: string }>(
      `SELECT
         (clock_timestamp() - INTERVAL '2 hours')::text AS initial_at,
         (clock_timestamp() - INTERVAL '1 hour')::text AS late_at`,
    );
    const { initial_at, late_at } = anchors.rows[0];
    const countedTotal = async () =>
      (
        await pool.query<{ total: string }>(
          `SELECT coalesce(sum(unique_count), 0)::text AS total
             FROM public.action_legacy_stats_daily
            WHERE action_id = $1`,
          [fixture.productionV3ActionId],
        )
      ).rows[0].total;

    await insertV3Nullifier(pool, {
      id: "nil_contract_before_cutoff",
      createdAt: initial_at,
    });
    await installPauseTrigger();
    const blocker = await pool.connect();
    try {
      await blocker.query("SELECT pg_advisory_lock($1, $2)", barrierLock);
      const firstRun = callRollup();
      await waitForBarrierWaiter();

      await insertV3Nullifier(pool, {
        id: "nil_contract_after_v3_scan",
        createdAt: late_at,
      });
      await releaseBarrier(blocker);
      await firstRun;

      // The mid-run insert is invisible to the first run's single snapshot.
      expect(await countedTotal()).toBe("1");

      await callRollup();
      expect(await countedTotal()).toBe("2");
    } finally {
      await blocker.query("SELECT pg_advisory_unlock_all()");
      blocker.release();
    }
  });

  it("honors the safety delay around the database-owned cutoff", async () => {
    // Timing budget: the second row must still be younger than the 5-minute
    // safety delay when the rollup takes its cutoff, so the rollup has to
    // start within 4 minutes of this insert.
    await pool.query(
      `INSERT INTO public.nullifier_v4 (
         id, action_v4_id, created_at, nullifier
       ) VALUES
         ('nullifier_v4_contract_safely_before', $1,
          clock_timestamp() - INTERVAL '10 minutes', 900001),
         ('nullifier_v4_contract_inside_delay', $1,
          clock_timestamp() - INTERVAL '1 minute', 900002)`,
      [fixture.productionV4ActionId],
    );

    await callRollup();

    expect(
      await getDailyRows("action_v4_stats_daily", fixture.productionV4ActionId),
    ).toEqual([
      expect.objectContaining({
        action_v4_id: fixture.productionV4ActionId,
        unique_count: "1",
      }),
    ]);
  });

  it("recovers every missed day after a multi-day stalled watermark", async () => {
    await insertV3Nullifier(pool, {
      id: "nil_contract_stalled_initial",
      createdAt: "2026-01-20T12:00:00.000Z",
    });
    await callRollup();
    await pool.query(
      `UPDATE public.world_id_analytics_state
          SET processed_through = '2026-01-20T23:59:59.999Z'`,
    );

    for (const day of [21, 22, 23, 24, 25]) {
      await insertV3Nullifier(pool, {
        id: `nil_contract_stalled_${day}`,
        createdAt: `2026-01-${day}T12:00:00.000Z`,
        uses: day % 9,
      });
    }
    await callRollup();

    expect(
      (
        await getDailyRows(
          "action_legacy_stats_daily",
          fixture.productionV3ActionId,
        )
      ).map((row) => row.date_utc),
    ).toEqual([
      "2026-01-20",
      "2026-01-21",
      "2026-01-22",
      "2026-01-23",
      "2026-01-24",
      "2026-01-25",
    ]);
  });

  it("keeps one unique watermark and never moves it backward", async () => {
    await callRollup();
    const future = await pool.query<{ processed_through: string }>(
      `UPDATE public.world_id_analytics_state
          SET processed_through = clock_timestamp() + INTERVAL '2 days'
      RETURNING processed_through::text`,
    );

    await callRollup();
    const state = await pool.query<{ processed_through: string }>(
      `SELECT processed_through::text
         FROM public.world_id_analytics_state`,
    );

    expect(state.rows).toHaveLength(1);
    expect(
      new Date(state.rows[0].processed_through).getTime(),
    ).toBeGreaterThanOrEqual(
      new Date(future.rows[0].processed_through).getTime(),
    );
  });
});
// #endregion

// #region Atomicity and single-run exclusion
describe("World ID analytics [real atomicity and locking]", () => {
  it("rolls back both source legs and shared state when the v4 leg fails", async () => {
    await insertV3Nullifier(pool, {
      id: "nil_contract_atomic_v3",
      createdAt: "2026-01-10T12:00:00.000Z",
    });
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_contract_atomic_v4",
      createdAt: "2026-01-10T12:00:00.000Z",
    });
    await pool.query(
      `CREATE FUNCTION public.contract_fail_v4_analytics_rollup()
       RETURNS trigger LANGUAGE plpgsql AS $$
       BEGIN
         RAISE EXCEPTION 'contract v4 leg failure';
       END
       $$`,
    );
    await pool.query(
      `CREATE TRIGGER contract_fail_v4_analytics_rollup
       BEFORE INSERT ON public.action_v4_stats_daily
       FOR EACH ROW EXECUTE FUNCTION public.contract_fail_v4_analytics_rollup()`,
    );

    await expect(callRollup()).rejects.toThrow("rollup failed (500)");
    expect(
      await getDailyRows(
        "action_legacy_stats_daily",
        fixture.productionV3ActionId,
      ),
    ).toEqual([]);
    expect(
      await getDailyRows("action_v4_stats_daily", fixture.productionV4ActionId),
    ).toEqual([]);
    expect(
      (await pool.query("SELECT * FROM public.world_id_analytics_state")).rows,
    ).toEqual([]);
  });

  it("lets a concurrent cron invocation exit successfully while the first owns the rollup", async () => {
    await insertV3Nullifier(pool, {
      id: "nil_contract_lock",
      createdAt: "2026-01-10T12:00:00.000Z",
    });
    await installPauseTrigger();
    const blocker = await pool.connect();
    try {
      await blocker.query("SELECT pg_advisory_lock($1, $2)", barrierLock);
      const firstRun = callRollup();
      await waitForBarrierWaiter();

      await expect(callRollup()).resolves.toEqual({
        success: true,
        outcome: "lock_missed",
      });
      expect(
        await getDailyRows(
          "action_legacy_stats_daily",
          fixture.productionV3ActionId,
        ),
      ).toEqual([]);

      await releaseBarrier(blocker);
      await firstRun;
      expect(
        await getDailyRows(
          "action_legacy_stats_daily",
          fixture.productionV3ActionId,
        ),
      ).toHaveLength(1);
    } finally {
      await blocker.query("SELECT pg_advisory_unlock_all()");
      blocker.release();
    }
  });

  it("uses lock (533214,43) and remains independent of legacy lock (533214,42)", async () => {
    await insertV3Nullifier(pool, {
      id: "nil_contract_exact_lock",
      createdAt: "2026-01-10T12:00:00.000Z",
    });
    const lockClient = await pool.connect();
    try {
      await lockClient.query("BEGIN");
      await lockClient.query("SELECT pg_advisory_xact_lock(533214, 43)");
      await expect(callRollup()).resolves.toEqual({
        success: true,
        outcome: "lock_missed",
      });
      expect(
        await getDailyRows(
          "action_legacy_stats_daily",
          fixture.productionV3ActionId,
        ),
      ).toEqual([]);

      await lockClient.query("ROLLBACK");
      await lockClient.query("BEGIN");
      await lockClient.query("SELECT pg_advisory_xact_lock(533214, 42)");
      await expect(callRollup()).resolves.toEqual({
        success: true,
        outcome: "advanced",
        processed_through: expect.any(String),
      });
      expect(
        await getDailyRows(
          "action_legacy_stats_daily",
          fixture.productionV3ActionId,
        ),
      ).toHaveLength(1);
    } finally {
      await lockClient.query("ROLLBACK");
      lockClient.release();
    }
  });
});
// #endregion

// #region Deletion and no resurrection
describe("World ID analytics [real action deletion]", () => {
  it.each([
    [
      "v3",
      fixture.productionV3ActionId,
      "action_legacy_stats_daily",
      "action_id",
    ],
    [
      "v4",
      fixture.productionV4ActionId,
      "action_v4_stats_daily",
      "action_v4_id",
    ],
  ] as const)(
    "cascades %s history and does not resurrect it",
    async (source, actionId, table, idColumn) => {
      if (source === "v3") {
        await insertV3Nullifier(pool, {
          id: "nil_contract_delete_v3",
          createdAt: "2026-01-10T12:00:00.000Z",
        });
      } else {
        await insertV4Nullifier(pool, {
          id: "nullifier_v4_contract_delete_v4",
          createdAt: "2026-01-10T12:00:00.000Z",
        });
      }
      await callRollup();

      await pool.query(
        `DELETE FROM public.${source === "v3" ? "action" : "action_v4"}
          WHERE id = $1`,
        [actionId],
      );
      await callRollup();

      expect(
        (
          await pool.query(
            `SELECT 1 FROM public.${table} WHERE ${idColumn} = $1`,
            [actionId],
          )
        ).rows,
      ).toEqual([]);
    },
  );

  it("lets deletion win a deterministic insert race with no timing sleep", async () => {
    await insertV3Nullifier(pool, {
      id: "nil_contract_delete_race",
      createdAt: "2026-01-10T12:00:00.000Z",
    });
    await installPauseTrigger();
    const blocker = await pool.connect();
    const deleteClient = await pool.connect();
    try {
      await blocker.query("SELECT pg_advisory_lock($1, $2)", barrierLock);
      const rollup = callRollup();
      await waitForBarrierWaiter();

      await deleteClient.query("SET lock_timeout = '750ms'");
      await deleteClient.query("SET statement_timeout = '2s'");
      await expect(
        deleteClient.query("DELETE FROM public.action WHERE id = $1", [
          fixture.productionV3ActionId,
        ]),
      ).resolves.toEqual(expect.objectContaining({ rowCount: 1 }));

      await releaseBarrier(blocker);
      await expect(rollup).rejects.toThrow("rollup failed (500)");
      await callRollup();
      expect(
        await getDailyRows(
          "action_legacy_stats_daily",
          fixture.productionV3ActionId,
        ),
      ).toEqual([]);
    } finally {
      await blocker.query("SELECT pg_advisory_unlock_all()");
      blocker.release();
      deleteClient.release();
    }
  });
});
// #endregion

// #region Applied metadata and role isolation
describe("World ID analytics [real Hasura metadata]", () => {
  it("applies the five-minute protected cron while preserving the legacy hourly job", async () => {
    const response = await fetch(
      process.env.WIA_HASURA_METADATA_URL as string,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hasura-admin-secret": process.env
            .HASURA_GRAPHQL_ADMIN_SECRET as string,
        },
        body: JSON.stringify({ type: "export_metadata", args: {} }),
      },
    );
    expect(response.status).toBe(200);
    const metadata = (await response.json()) as {
      cron_triggers: Array<{
        headers?: Array<{ name: string; value_from_env?: string }>;
        name: string;
        schedule: string;
        webhook: string;
      }>;
    };
    const analyticsCron = metadata.cron_triggers.find((trigger) =>
      /world id analytics/i.test(trigger.name),
    );
    expect(analyticsCron).toEqual(
      expect.objectContaining({
        schedule: "*/5 * * * *",
        webhook: "{{NEXT_API_URL}}/_rollup-world-id-analytics",
      }),
    );
    expect(analyticsCron?.headers).toContainEqual({
      name: "Authorization",
      value_from_env: "INTERNAL_ENDPOINTS_SECRET",
    });
    expect(
      metadata.cron_triggers.find(
        (trigger) => trigger.name === "Rollup app stats",
      ),
    ).toEqual(expect.objectContaining({ schedule: "0 * * * *" }));
  });

  it("exposes every tracked analytics table, state, return object, and function only to service", async () => {
    const metadataResponse = await fetch(
      process.env.WIA_HASURA_METADATA_URL as string,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-hasura-admin-secret": process.env
            .HASURA_GRAPHQL_ADMIN_SECRET as string,
        },
        body: JSON.stringify({ type: "export_metadata", args: {} }),
      },
    );
    const metadata = (await metadataResponse.json()) as {
      sources: Array<{
        functions?: Array<{
          configuration?: {
            custom_root_fields?: { function?: string };
          };
          function: { name: string; schema: string };
        }>;
        name: string;
        tables: Array<{
          configuration?: {
            custom_root_fields?: { select?: string };
          };
          table: { name: string; schema: string };
        }>;
      }>;
    };
    const source = metadata.sources.find((item) => item.name === "default");
    expect(source).toBeDefined();

    const analyticsName =
      /(?:world_id.*(?:analytics|stats_daily)|(?:analytics|stats_daily).*world_id|action_(?:legacy|v4)_stats_daily)/i;
    const trackedTables = (source?.tables ?? []).filter((item) =>
      analyticsName.test(item.table.name),
    );
    const trackedFunctions = (source?.functions ?? []).filter((item) =>
      analyticsName.test(item.function.name),
    );
    const returnedRelations = await pool.query<{ relation_name: string }>(
      `SELECT DISTINCT return_relation.relname AS relation_name
         FROM pg_proc
         JOIN pg_namespace
           ON pg_namespace.oid = pg_proc.pronamespace
         JOIN pg_class AS return_relation
           ON return_relation.oid = pg_proc.prorettype
        WHERE pg_namespace.nspname = 'public'
          AND pg_proc.proname ~*
              '(world_id.*(analytics|stats_daily)|(analytics|stats_daily).*world_id)'`,
    );
    const returnedNames = new Set(
      returnedRelations.rows.map((row) => row.relation_name),
    );
    for (const item of source?.tables ?? []) {
      if (returnedNames.has(item.table.name) && !trackedTables.includes(item)) {
        trackedTables.push(item);
      }
    }

    const tableRoots = trackedTables.map(
      (item) =>
        item.configuration?.custom_root_fields?.select ?? item.table.name,
    );
    const functionRoots = trackedFunctions.map(
      (item) =>
        item.configuration?.custom_root_fields?.function ?? item.function.name,
    );
    const everyRoot = [...tableRoots, ...functionRoots];

    expect(trackedTables.map((item) => item.table.name)).toEqual(
      expect.arrayContaining([
        "action_legacy_stats_daily",
        "action_v4_stats_daily",
        "world_id_analytics_state",
      ]),
    );
    expect(trackedFunctions.length).toBeGreaterThanOrEqual(2);
    expect(
      trackedFunctions.some((item) => /rollup/i.test(item.function.name)),
    ).toBe(true);
    expect(
      trackedFunctions.some((item) => /app.*daily/i.test(item.function.name)),
    ).toBe(true);

    const serviceToken = await generateServiceJWT();
    const userToken = (
      await generateUserJWT("usr_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
    ).token;
    const service = await readRoleSchema({
      authorization: `Bearer ${serviceToken}`,
    });
    const user = await readRoleSchema({
      authorization: `Bearer ${userToken}`,
    });
    const publicRole = await readRoleSchema();

    for (const root of everyRoot) {
      expect(service.roots).toContain(root);
      expect(user.roots).not.toContain(root);
      expect(publicRole.roots).not.toContain(root);
    }
    for (const table of trackedTables) {
      expect(service.types).toContain(table.table.name);
      expect(user.types).not.toContain(table.table.name);
      expect(publicRole.types).not.toContain(table.table.name);
    }

    const serviceTableQuery = trackedTables
      .map(
        (table, index) =>
          `table_${index}: ${
            table.configuration?.custom_root_fields?.select ?? table.table.name
          }(limit: 0) { __typename }`,
      )
      .join("\n");
    const serviceRead = await graphRequest({
      headers: { authorization: `Bearer ${serviceToken}` },
      query: `query EveryAnalyticsTable { ${serviceTableQuery} }`,
    });
    expect(serviceRead.body.errors).toBeUndefined();
    expect(Object.keys(serviceRead.body.data ?? {})).toHaveLength(
      trackedTables.length,
    );
  });
});
// #endregion
