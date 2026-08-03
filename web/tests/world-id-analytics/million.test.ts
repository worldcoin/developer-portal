import { POST as rollupWorldIdAnalytics } from "@/api/_rollup-world-id-analytics";
import { GET as getWorldIdAnalytics } from "@/api/portal/apps/[app_id]/world-id-analytics";
import { NextRequest } from "next/server";
import { execFileSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { Pool } from "pg";
import { normalizeAnalyticsResponse } from "../contracts/world-id-analytics-endpoint";
import {
  readCanonicalSourceDaily,
  readRolledSourceDaily,
  toAppDailyRows,
  toAppSourceLifetimeRows,
  toLifetimeRows,
  type AppDailyRow,
  type SourceDailyRow,
} from "./canonical-analytics";
import { fixture, resetFixture, seedFixture } from "./fresh-stack-fixture";

// #region Mocks
const getIsUserAllowedToReadApp = jest.fn().mockResolvedValue(true);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/permissions", () => ({
  getIsUserAllowedToReadApp: (...args: unknown[]) =>
    getIsUserAllowedToReadApp(...args),
}));
// #endregion

// #region Test Data
const pool = new Pool({ max: 6 });
const enabled = process.env.WIA_ANALYTICS_MILLION === "1";
const sampleCount = 10;

type EndpointSample = {
  body: ReturnType<typeof normalizeAnalyticsResponse>;
  bytes: number;
  elapsedMs: number;
};

const runRollup = async () => {
  const started = performance.now();
  const response = await rollupWorldIdAnalytics(
    new NextRequest("http://localhost:3000/api/_rollup-world-id-analytics", {
      method: "POST",
      headers: {
        authorization: process.env.INTERNAL_ENDPOINTS_SECRET as string,
      },
    }),
  );
  const elapsedMs = performance.now() - started;
  const body = await response.json();
  expect({ status: response.status, body }).toEqual({
    status: 200,
    body: { success: true },
  });
  return elapsedMs;
};

const readEndpoint = async (
  period: "all_time" | "last_7_days",
): Promise<EndpointSample> => {
  const started = performance.now();
  const response = await getWorldIdAnalytics(
    new NextRequest(
      `http://localhost:3000/api/portal/apps/${fixture.productionAppId}/world-id-analytics?environment=production&period=${period}`,
    ),
    { params: Promise.resolve({ app_id: fixture.productionAppId }) },
  );
  const text = await response.text();
  const elapsedMs = performance.now() - started;
  expect(response.status).toBe(200);
  return {
    body: normalizeAnalyticsResponse(JSON.parse(text)),
    bytes: Buffer.byteLength(text),
    elapsedMs,
  };
};

const percentile = (values: number[], percentileValue: number) => {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(
    0,
    Math.ceil((percentileValue / 100) * sorted.length) - 1,
  );
  return sorted[index];
};

const summarizeSamples = (samples: EndpointSample[]) => ({
  p50Ms: percentile(
    samples.map((sample) => sample.elapsedMs),
    50,
  ),
  p95Ms: percentile(
    samples.map((sample) => sample.elapsedMs),
    95,
  ),
  payloadP50Bytes: percentile(
    samples.map((sample) => sample.bytes),
    50,
  ),
  payloadMaxBytes: Math.max(...samples.map((sample) => sample.bytes)),
});

const applyOptionalBudget = (environmentVariable: string, actual: number) => {
  const configured = process.env[environmentVariable];
  if (configured === undefined) return false;

  const budget = Number(configured);
  expect(Number.isFinite(budget) && budget > 0).toBe(true);
  expect(actual).toBeLessThanOrEqual(budget);
  return true;
};

// auto_explain at log_min_duration=0 logs every statement, so the full
// history since boot outgrows Node's maximum string length under load.
// Capture windows with --since (1s of skew slack) instead of prefix-diffing
// full reads.
const readOwnPostgresLogs = (since: string) =>
  execFileSync(
    "docker",
    [
      "compose",
      "--project-name",
      process.env.WIA_COMPOSE_PROJECT as string,
      "--file",
      process.env.WIA_COMPOSE_FILE as string,
      "logs",
      "--no-color",
      "--since",
      since,
      "postgres",
    ],
    { encoding: "utf8", maxBuffer: 1024 * 1024 * 1024 },
  );

const logWindowStart = () => new Date(Date.now() - 1_000).toISOString();

const relevantPlanLines = (plan: string) =>
  plan
    .split(/\r?\n/)
    .filter((line) =>
      /duration:|Buffers:|Scan|Index|Filter:|Function|stats_daily|nullifier/i.test(
        line,
      ),
    )
    .join("\n");

const expectActualRecurringPlans = (plan: string) => {
  expect(plan).toMatch(/duration:.*plan:/i);
  expect(plan).toMatch(/Buffers:/i);
  for (const table of ["nullifier", "nullifier_v4"]) {
    expect(plan).toMatch(
      new RegExp(
        `(?:(?:Index|Bitmap)[^\\n]*${table}|${table}[^\\n]*(?:Index|Bitmap))`,
        "i",
      ),
    );
  }
};

const expectActualAppReadPlans = (plan: string) => {
  expect(plan).toMatch(/duration:.*plan:/i);
  expect(plan).toMatch(/Buffers:/i);
  expect(plan).toMatch(/action_legacy_stats_daily|action_v4_stats_daily/i);
  expect(plan).not.toMatch(
    /(?:Seq Scan|Index Scan|Index Only Scan|Bitmap Heap Scan)\s+on\s+(?:public\.)?nullifier(?:_v4)?\b/i,
  );
};

const assertCanonicalParity = async () => {
  const canonical = await readCanonicalSourceDaily(pool, fixture.teamId);
  const rolled = await readRolledSourceDaily(pool, fixture.teamId);

  expect(rolled.filter((row) => row.source === "legacy")).toEqual(
    canonical.filter((row) => row.source === "legacy"),
  );
  expect(rolled.filter((row) => row.source === "v4")).toEqual(
    canonical.filter((row) => row.source === "v4"),
  );
  expect(toLifetimeRows(rolled)).toEqual(toLifetimeRows(canonical));
  expect(toAppSourceLifetimeRows(rolled)).toEqual(
    toAppSourceLifetimeRows(canonical),
  );
  expect(toAppDailyRows(rolled)).toEqual(toAppDailyRows(canonical));
  return canonical;
};

const assertEveryAppEnvironmentEndpoint = async (
  canonical: SourceDailyRow[],
) => {
  const expectedDaily = toAppDailyRows(canonical);
  const expectedSourceTotals = toAppSourceLifetimeRows(canonical);
  for (const appId of [
    fixture.productionAppId,
    fixture.stagingAppId,
    fixture.v3OnlyAppId,
    fixture.v4OnlyAppId,
  ]) {
    for (const environment of ["production", "staging"] as const) {
      const expectedActionDaily = canonical.filter(
        (row) => row.app_id === appId && row.environment === environment,
      );
      const actionIds = [
        ...new Set(expectedActionDaily.map((row) => row.action_id)),
      ];
      const search = new URLSearchParams({
        environment,
        period: "all_time",
      });
      if (actionIds.length > 0) search.set("action_ids", actionIds.join(","));
      const expected = expectedDaily.filter(
        (row) => row.app_id === appId && row.environment === environment,
      );
      const response = await getWorldIdAnalytics(
        new NextRequest(
          `http://localhost:3000/api/portal/apps/${appId}/world-id-analytics?${search}`,
        ),
        { params: Promise.resolve({ app_id: appId }) },
      );
      expect(response.status).toBe(200);
      const body = normalizeAnalyticsResponse(await response.json());
      const actual = body.app.series
        .filter((point) => point.count !== "0")
        .map((point) => ({
          app_id: appId,
          environment,
          date_utc: point.date,
          count: point.count,
        }));
      expect(actual).toEqual(expected);
      expect(body.app.count).toBe(
        expected
          .reduce((total, row) => total + BigInt(row.count), 0n)
          .toString(),
      );

      const actualActionMetrics = [
        ...body.legacyActions.map((metric) => ({
          ...metric,
          source: "legacy" as const,
        })),
        ...body.actions.map((metric) => ({
          ...metric,
          source: "v4" as const,
        })),
      ];
      const actualActionDaily = actualActionMetrics
        .flatMap((metric) =>
          metric.series
            .filter((point) => point.count !== "0")
            .map((point) => ({
              action_id: metric.id,
              app_id: appId,
              count: point.count,
              date_utc: point.date,
              environment,
              source: metric.source,
            })),
        )
        .sort(
          (left, right) =>
            [
              left.source.localeCompare(right.source),
              left.action_id.localeCompare(right.action_id),
              left.date_utc.localeCompare(right.date_utc),
            ].find((comparison) => comparison !== 0) ?? 0,
        );
      expect(actualActionDaily).toEqual(expectedActionDaily);

      const actualSourceTotals = [
        ...new Set(actualActionMetrics.map((metric) => metric.source)),
      ]
        .map((source) => ({
          app_id: appId,
          count: actualActionMetrics
            .filter((metric) => metric.source === source)
            .reduce((total, metric) => total + BigInt(metric.count), 0n)
            .toString(),
          environment,
          source,
        }))
        .sort((left, right) => left.source.localeCompare(right.source));
      expect(actualSourceTotals).toEqual(
        expectedSourceTotals.filter(
          (row) => row.app_id === appId && row.environment === environment,
        ),
      );
    }
  }
};

const expectedForReturnedDates = (
  expectedDaily: AppDailyRow[],
  sample: EndpointSample,
) => {
  const returnedDates = new Set(
    sample.body.app.series.map((point) => point.date),
  );
  return expectedDaily
    .filter(
      (row) =>
        row.app_id === fixture.productionAppId &&
        row.environment === "production" &&
        returnedDates.has(row.date_utc),
    )
    .reduce((total, row) => total + BigInt(row.count), 0n)
    .toString();
};
// #endregion

beforeAll(async () => {
  if (enabled && process.env.WIA_FRESH_STACK !== "true") {
    throw new Error(
      "Run through pnpm test:world-id-analytics:million; shared stacks are forbidden",
    );
  }
});

afterAll(async () => {
  if (enabled) await resetFixture(pool);
  await pool.end();
});

(enabled ? describe : describe.skip)(
  "World ID analytics [opt-in one-million-row gate]",
  () => {
    jest.setTimeout(600_000);

    it("proves canonical parity, overlap recovery, actual plans, and endpoint evidence", async () => {
      await resetFixture(pool);
      await seedFixture(pool);

      const databaseAnchor = await pool.query<{
        captured_at: string;
        initial_cutoff_anchor: string;
        newest_initial_at: string;
      }>(
        `WITH anchor AS (
           SELECT clock_timestamp() AS captured_at
         )
         SELECT
           captured_at::text,
           (captured_at - INTERVAL '5 minutes')::text
             AS initial_cutoff_anchor,
           (captured_at - INTERVAL '2 hours')::text AS newest_initial_at
         FROM anchor`,
      );
      expect(databaseAnchor.rows).toHaveLength(1);
      const { captured_at, initial_cutoff_anchor, newest_initial_at } =
        databaseAnchor.rows[0];
      expect(new Date(newest_initial_at).getTime()).toBeLessThan(
        new Date(initial_cutoff_anchor).getTime(),
      );
      expect(new Date(initial_cutoff_anchor).getTime()).toBeLessThan(
        new Date(captured_at).getTime(),
      );

      await pool.query(
        `INSERT INTO public.nullifier (
           id, action_id, created_at, updated_at, nullifier_hash, uses
         )
         SELECT
           'nil_load_' || lpad(value::text, 12, '0'),
           (ARRAY[$1, $2, $3, $4]::text[])[((value - 1) % 4) + 1],
           $5::timestamptz
             - ((value - 1) % 31) * INTERVAL '24 hours',
           $5::timestamptz
             - ((value - 1) % 31) * INTERVAL '24 hours',
           'load_hash_' || value,
           value % 9
         FROM generate_series(1, 500000) AS value`,
        [
          fixture.productionV3ActionId,
          fixture.secondProductionV3ActionId,
          fixture.stagingV3ActionId,
          fixture.v3OnlyActionId,
          newest_initial_at,
        ],
      );
      await pool.query(
        `INSERT INTO public.nullifier_v4 (
           id, action_v4_id, created_at, nullifier
         )
         SELECT
           'nullifier_v4_load_' || lpad(value::text, 12, '0'),
           (ARRAY[$1, $2, $3, $4, $5, $6]::text[])[((value - 1) % 6) + 1],
           $7::timestamptz
             - ((value - 1) % 31) * INTERVAL '24 hours',
           (2000000 + value)::numeric
         FROM generate_series(1, 500000) AS value`,
        [
          fixture.productionV4ActionId,
          fixture.secondProductionV4ActionId,
          fixture.stagingV4ActionId,
          fixture.v4OnlyActionId,
          fixture.productionStagingV4ActionId,
          fixture.stagingProductionV4ActionId,
          newest_initial_at,
        ],
      );

      const initialRawCount = await pool.query<{ count: string }>(
        `SELECT (
           (SELECT count(*) FROM public.nullifier
             WHERE id LIKE 'nil_load_%')
           +
           (SELECT count(*) FROM public.nullifier_v4
             WHERE id LIKE 'nullifier_v4_load_%')
         )::text AS count`,
      );
      expect(initialRawCount.rows[0].count).toBe("1000000");

      const initialCanonical = await readCanonicalSourceDaily(
        pool,
        fixture.teamId,
      );
      expect(
        initialCanonical.reduce((total, row) => total + BigInt(row.count), 0n),
      ).toBe(1_000_000n);
      expect(new Set(initialCanonical.map((row) => row.source))).toEqual(
        new Set(["legacy", "v4"]),
      );
      expect(new Set(initialCanonical.map((row) => row.environment))).toEqual(
        new Set(["production", "staging"]),
      );
      expect(new Set(initialCanonical.map((row) => row.app_id)).size).toBe(4);
      expect(new Set(initialCanonical.map((row) => row.action_id)).size).toBe(
        10,
      );
      expect(new Set(initialCanonical.map((row) => row.date_utc)).size).toBe(
        31,
      );

      const backfillMs = await runRollup();
      const afterBackfill = await assertCanonicalParity();
      expect(afterBackfill).toEqual(initialCanonical);
      await assertEveryAppEnvironmentEndpoint(afterBackfill);

      const indexEvidence = await pool.query<{
        has_created_at_index: boolean;
        table_name: string;
      }>(
        `SELECT
           expected.table_name,
           bool_or(
             pg_index.indisvalid
             AND pg_index.indisready
             AND (pg_get_indexdef(pg_index.indexrelid) ~* '\\(created_at')
           ) AS has_created_at_index
         FROM unnest(ARRAY['nullifier', 'nullifier_v4'])
              AS expected(table_name)
         JOIN pg_class ON pg_class.relname = expected.table_name
         JOIN pg_namespace
           ON pg_namespace.oid = pg_class.relnamespace
          AND pg_namespace.nspname = 'public'
         LEFT JOIN pg_index ON pg_index.indrelid = pg_class.oid
         GROUP BY expected.table_name
         ORDER BY expected.table_name`,
      );
      expect(indexEvidence.rows).toEqual([
        { table_name: "nullifier", has_created_at_index: true },
        { table_name: "nullifier_v4", has_created_at_index: true },
      ]);

      const catchupWindow = await pool.query<{
        catchup_at: string;
        catchup_date: string;
        previous_cutoff: string;
        previous_cutoff_candidate: string;
      }>(
        `WITH boundaries AS (
           SELECT
             $1::timestamptz AS initial_anchor,
             processed_through AS previous_cutoff,
             processed_through - INTERVAL '1 hour'
               AS previous_cutoff_candidate
           FROM public.world_id_analytics_state
         ),
         delayed_row AS (
           SELECT
             CASE
               WHEN (
                 previous_cutoff_candidate AT TIME ZONE 'UTC'
               )::date = (initial_anchor AT TIME ZONE 'UTC')::date
                 THEN previous_cutoff_candidate
               ELSE initial_anchor
             END AS catchup_at,
             previous_cutoff,
             previous_cutoff_candidate
           FROM boundaries
         )
         SELECT
           catchup_at::text,
           (catchup_at AT TIME ZONE 'UTC')::date::text AS catchup_date,
           previous_cutoff::text,
           previous_cutoff_candidate::text
         FROM delayed_row`,
        [newest_initial_at],
      );
      expect(catchupWindow.rows).toHaveLength(1);
      const {
        catchup_at,
        catchup_date,
        previous_cutoff,
        previous_cutoff_candidate,
      } = catchupWindow.rows[0];
      expect(new Date(newest_initial_at).getTime()).toBeLessThan(
        new Date(previous_cutoff).getTime(),
      );
      expect(new Date(catchup_at).getTime()).toBeLessThanOrEqual(
        new Date(previous_cutoff_candidate).getTime(),
      );
      expect(new Date(catchup_at).getTime()).toBeLessThan(
        new Date(previous_cutoff).getTime(),
      );

      await pool.query(
        `INSERT INTO public.nullifier (
           id, action_id, created_at, updated_at, nullifier_hash, uses
         )
         SELECT
           'nil_catchup_' || lpad(value::text, 12, '0'),
           (ARRAY[$1, $2, $3, $4]::text[])[((value - 1) % 4) + 1],
           $5::timestamptz,
           $5::timestamptz,
           'catchup_hash_' || value,
           value % 9
         FROM generate_series(1, 5000) AS value`,
        [
          fixture.productionV3ActionId,
          fixture.secondProductionV3ActionId,
          fixture.stagingV3ActionId,
          fixture.v3OnlyActionId,
          catchup_at,
        ],
      );
      await pool.query(
        `INSERT INTO public.nullifier_v4 (
           id, action_v4_id, created_at, nullifier
         )
         SELECT
           'nullifier_v4_catchup_' || lpad(value::text, 12, '0'),
           (ARRAY[$1, $2, $3, $4, $5, $6]::text[])[((value - 1) % 6) + 1],
           $7::timestamptz,
           (3000000 + value)::numeric
         FROM generate_series(1, 5000) AS value`,
        [
          fixture.productionV4ActionId,
          fixture.secondProductionV4ActionId,
          fixture.stagingV4ActionId,
          fixture.v4OnlyActionId,
          fixture.productionStagingV4ActionId,
          fixture.stagingProductionV4ActionId,
          catchup_at,
        ],
      );

      const catchupReadiness = await pool.query<{
        next_overlap_lower_bound: string;
        next_rebuild_start_date: string;
        v3_before: string;
        v4_before: string;
      }>(
        `WITH observed_boundaries AS (
           SELECT
             clock_timestamp() - INTERVAL '25 hours 5 minutes'
               AS next_overlap_lower_bound,
             processed_through AS previous_cutoff
           FROM public.world_id_analytics_state
         )
         SELECT
           next_overlap_lower_bound::text,
           (
             LEAST(previous_cutoff, next_overlap_lower_bound)
               AT TIME ZONE 'UTC'
           )::date::text AS next_rebuild_start_date,
           (
             SELECT coalesce(sum(unique_count), 0)::text
             FROM public.action_legacy_stats_daily
             WHERE date_utc = $1::date
           ) AS v3_before,
           (
             SELECT coalesce(sum(unique_count), 0)::text
             FROM public.action_v4_stats_daily
             WHERE date_utc = $1::date
           ) AS v4_before
         FROM observed_boundaries`,
        [catchup_date],
      );
      expect(catchupReadiness.rows).toHaveLength(1);
      const {
        next_overlap_lower_bound,
        next_rebuild_start_date,
        v3_before,
        v4_before,
      } = catchupReadiness.rows[0];
      expect(BigInt(v3_before)).toBeGreaterThan(0n);
      expect(BigInt(v4_before)).toBeGreaterThan(0n);
      expect(
        new Date(catchup_at).getTime() -
          new Date(next_overlap_lower_bound).getTime(),
      ).toBeGreaterThan(20 * 60 * 60 * 1_000);
      expect(
        next_rebuild_start_date.localeCompare(catchup_date),
      ).toBeLessThanOrEqual(0);

      const catchupLogWindow = logWindowStart();
      const catchupMs = await runRollup();
      const catchupPlans = readOwnPostgresLogs(catchupLogWindow);
      expectActualRecurringPlans(catchupPlans);

      const nextCutoff = await pool.query<{
        overlap_start: string;
        processed_through: string;
      }>(
        `SELECT
           (processed_through - INTERVAL '25 hours')::text AS overlap_start,
           processed_through::text
           FROM public.world_id_analytics_state`,
      );
      expect(nextCutoff.rows).toHaveLength(1);
      expect(
        new Date(nextCutoff.rows[0].processed_through).getTime(),
      ).toBeGreaterThanOrEqual(new Date(previous_cutoff).getTime());
      expect(new Date(catchup_at).getTime()).toBeGreaterThan(
        new Date(nextCutoff.rows[0].overlap_start).getTime(),
      );
      expect(new Date(catchup_at).getTime()).toBeLessThan(
        new Date(nextCutoff.rows[0].processed_through).getTime(),
      );

      const recaptured = await pool.query<{
        v3_after: string;
        v4_after: string;
      }>(
        `SELECT
           (
             SELECT coalesce(sum(unique_count), 0)::text
             FROM public.action_legacy_stats_daily
             WHERE date_utc = $1::date
           ) AS v3_after,
           (
             SELECT coalesce(sum(unique_count), 0)::text
             FROM public.action_v4_stats_daily
             WHERE date_utc = $1::date
           ) AS v4_after`,
        [catchup_date],
      );
      expect(BigInt(recaptured.rows[0].v3_after) - BigInt(v3_before)).toBe(
        5_000n,
      );
      expect(BigInt(recaptured.rows[0].v4_after) - BigInt(v4_before)).toBe(
        5_000n,
      );

      const afterCatchup = await assertCanonicalParity();
      expect(
        afterCatchup.reduce((total, row) => total + BigInt(row.count), 0n),
      ).toBe(1_010_000n);
      await assertEveryAppEnvironmentEndpoint(afterCatchup);

      const expectedDaily = toAppDailyRows(afterCatchup);
      await readEndpoint("last_7_days");
      await readEndpoint("all_time");
      // Separate the window from the preceding canonical raw-SQL scans so
      // the skew slack cannot pull them into the no-raw-reads assertion.
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      const endpointWindow = logWindowStart();
      const last7Samples: EndpointSample[] = [];
      const allTimeSamples: EndpointSample[] = [];
      for (let sample = 0; sample < sampleCount; sample += 1) {
        last7Samples.push(await readEndpoint("last_7_days"));
        allTimeSamples.push(await readEndpoint("all_time"));
      }
      const endpointPlans = readOwnPostgresLogs(endpointWindow);
      expectActualAppReadPlans(endpointPlans);

      for (const sample of [...last7Samples, ...allTimeSamples]) {
        expect(sample.body.app.count).toBe(
          expectedForReturnedDates(expectedDaily, sample),
        );
      }

      const last7Evidence = summarizeSamples(last7Samples);
      const allTimeEvidence = summarizeSamples(allTimeSamples);
      const configuredBudgets = {
        last7P95: applyOptionalBudget(
          "WIA_ANALYTICS_LAST_7_P95_BUDGET_MS",
          last7Evidence.p95Ms,
        ),
        allTimeP95: applyOptionalBudget(
          "WIA_ANALYTICS_ALL_TIME_P95_BUDGET_MS",
          allTimeEvidence.p95Ms,
        ),
        payload: applyOptionalBudget(
          "WIA_ANALYTICS_PAYLOAD_BUDGET_BYTES",
          Math.max(
            last7Evidence.payloadMaxBytes,
            allTimeEvidence.payloadMaxBytes,
          ),
        ),
        backfill: applyOptionalBudget(
          "WIA_ANALYTICS_BACKFILL_BUDGET_MS",
          backfillMs,
        ),
        catchup: applyOptionalBudget(
          "WIA_ANALYTICS_CATCHUP_BUDGET_MS",
          catchupMs,
        ),
      };
      const outstandingProductionGates = Object.entries(configuredBudgets)
        .filter(([, configured]) => !configured)
        .map(([name]) => name);

      console.info(
        JSON.stringify(
          {
            rows: {
              initial: 1_000_000,
              afterCatchup: 1_010_000,
            },
            rollupMs: {
              backfill: Math.round(backfillMs),
              catchup: Math.round(catchupMs),
            },
            endpoint: {
              samplesPerPeriod: sampleCount,
              last7Days: last7Evidence,
              allTime: allTimeEvidence,
            },
            configuredBudgets,
            outstandingProductionGates,
            actualPlans: {
              recurringCatchup: relevantPlanLines(catchupPlans),
              endpointReads: relevantPlanLines(endpointPlans),
            },
          },
          null,
          2,
        ),
      );
    });
  },
);
