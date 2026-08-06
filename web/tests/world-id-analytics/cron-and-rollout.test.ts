import { POST } from "@/api/_rollup-world-id-analytics";
import { NextRequest } from "next/server";
import { createServer, type IncomingMessage, type Server } from "node:http";
import { Pool } from "pg";
import {
  fixture,
  insertV3Nullifier,
  insertV4Nullifier,
  resetFixture,
  seedFixture,
} from "./fresh-stack-fixture";
import { requiredEnv } from "./run-sql-operation";

// #region Mocks
// Only the log sink is mocked. The route, the GraphQL client, the service JWT,
// Hasura and Postgres are all real in this suite.
const loggerInfo = jest.fn();
const loggerWarn = jest.fn();
const loggerError = jest.fn();

jest.mock("@/lib/logger", () => ({
  logger: {
    info: (...args: unknown[]) => loggerInfo(...args),
    warn: (...args: unknown[]) => loggerWarn(...args),
    error: (...args: unknown[]) => loggerError(...args),
  },
}));
// #endregion

// #region Test Data
const pool = new Pool();
const CRON_TRIGGER = "Rollup World ID analytics";

const request = (
  body?: unknown,
  authorization = requiredEnv("INTERNAL_ENDPOINTS_SECRET"),
) =>
  new NextRequest("http://localhost:3000/api/_rollup-world-id-analytics", {
    method: "POST",
    headers: { authorization },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const metadataRequest = async (body: unknown) => {
  const response = await fetch(requiredEnv("WIA_HASURA_METADATA_URL"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hasura-admin-secret": requiredEnv("HASURA_GRAPHQL_ADMIN_SECRET"),
    },
    body: JSON.stringify(body),
  });

  const payload: unknown = await response.json();
  if (!response.ok) {
    throw new Error(
      `Hasura metadata API ${response.status}: ${JSON.stringify(payload)}`,
    );
  }
  return payload as Record<string, any>;
};

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

const daysAgoNoon = (daysAgo: number) => {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  date.setUTCHours(12, 0, 0, 0);
  return date.toISOString();
};

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

const rolledLegacyDates = async () =>
  (
    await pool.query<{ date_utc: string }>(
      `SELECT date_utc::text FROM public.action_legacy_stats_daily
        ORDER BY date_utc`,
    )
  ).rows.map((row) => row.date_utc);

const seedOneVerificationPerSource = async () => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  await insertV3Nullifier(pool, {
    id: "nullifier_v3_rollout_gate",
    createdAt: twoHoursAgo,
  });
  await insertV4Nullifier(pool, {
    id: "nullifier_v4_rollout_gate",
    createdAt: twoHoursAgo,
  });
};

const rolledCounts = async () => ({
  legacy: (
    await pool.query(
      `SELECT unique_count::text FROM public.action_legacy_stats_daily
        WHERE action_id = $1`,
      [fixture.productionV3ActionId],
    )
  ).rows,
  v4: (
    await pool.query(
      `SELECT unique_count::text FROM public.action_v4_stats_daily
        WHERE action_v4_id = $1`,
      [fixture.productionV4ActionId],
    )
  ).rows,
});

const removeChunkSabotage = async () => {
  await pool.query(`
    DROP TRIGGER IF EXISTS contract_fail_v3_analytics_chunk
      ON public.action_legacy_stats_daily;
    DROP FUNCTION IF EXISTS public.contract_fail_v3_analytics_chunk();
  `);
};
// #endregion

beforeAll(() => {
  if (process.env.WIA_FRESH_STACK !== "true") {
    throw new Error(
      "Run through the isolated World ID analytics fresh-stack harness",
    );
  }
});

beforeEach(async () => {
  jest.clearAllMocks();
  delete process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED;
  await removeChunkSabotage();
  await resetFixture(pool);
  await seedFixture(pool);
});

afterEach(() => {
  delete process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED;
});

afterAll(async () => {
  await removeChunkSabotage();
  await resetFixture(pool);
  await pool.end();
});

jest.setTimeout(150_000);

// #region Cron wiring
describe("World ID analytics [cron trigger]", () => {
  it("targets the protected route on a fifteen-minute schedule", async () => {
    const exported = await metadataRequest({
      type: "export_metadata",
      args: {},
    });
    const metadata = exported.metadata ?? exported;
    const trigger = (metadata.cron_triggers ?? []).find(
      (candidate: { name: string }) => candidate.name === CRON_TRIGGER,
    );

    expect(trigger).toMatchObject({
      webhook: "{{NEXT_API_URL}}/_rollup-world-id-analytics",
      schedule: "*/15 * * * *",
      include_in_metadata: true,
    });
    expect(trigger.headers).toEqual([
      { name: "Authorization", value_from_env: "INTERNAL_ENDPOINTS_SECRET" },
    ]);
    // A missed tick must expire rather than pile up behind the next one.
    expect(trigger.retry_conf).toMatchObject({
      num_retries: 1,
      tolerance_seconds: 900,
    });
  });

  it("is scheduled by Hasura as events exactly fifteen minutes apart", async () => {
    const events = await pool.query<{
      epoch: string;
      minute: string;
      second: string;
    }>(
      `SELECT EXTRACT(EPOCH FROM scheduled_time)::bigint::text AS epoch,
              EXTRACT(MINUTE FROM scheduled_time)::text        AS minute,
              EXTRACT(SECOND FROM scheduled_time)::text        AS second
         FROM hdb_catalog.hdb_cron_events
        WHERE trigger_name = $1 AND status = 'scheduled'
        ORDER BY scheduled_time
        LIMIT 6`,
      [CRON_TRIGGER],
    );

    expect(events.rows.length).toBeGreaterThanOrEqual(2);
    for (const row of events.rows) {
      expect(Number(row.minute) % 15).toBe(0);
      expect(Number(row.second)).toBe(0);
    }
    const gaps = events.rows
      .slice(1)
      .map(
        (row, index) => Number(row.epoch) - Number(events.rows[index].epoch),
      );
    expect(gaps.every((gap) => gap === 900)).toBe(true);
  });

  it("delivers the webhook with the internal secret from its own environment", async () => {
    const delivered: Array<{ authorization?: string; method?: string }> = [];
    let received: (() => void) | undefined;
    const firstDelivery = new Promise<void>((resolve) => {
      received = resolve;
    });

    const server: Server = createServer(
      (message: IncomingMessage, response) => {
        delivered.push({
          authorization: message.headers.authorization,
          method: message.method,
        });
        response.writeHead(200, { "content-type": "application/json" });
        response.end("{}");
        received?.();
      },
    );

    try {
      await new Promise<void>((resolve) => server.listen(0, resolve));
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("test webhook server did not bind a port");
      }

      await metadataRequest({
        type: "create_scheduled_event",
        args: {
          webhook: `http://host.docker.internal:${address.port}/rollup`,
          schedule_at: new Date().toISOString(),
          payload: {},
          // Same indirection the cron trigger uses, so this proves the secret
          // reaches the request from Hasura's environment.
          headers: [
            {
              name: "Authorization",
              value_from_env: "INTERNAL_ENDPOINTS_SECRET",
            },
          ],
          retry_conf: { num_retries: 0, timeout_seconds: 10 },
          comment: "World ID analytics cron delivery contract",
        },
      });

      await Promise.race([
        firstDelivery,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Hasura never delivered the webhook")),
            90_000,
          ),
        ),
      ]);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    expect(delivered[0]).toEqual({
      authorization: requiredEnv("INTERNAL_ENDPOINTS_SECRET"),
      method: "POST",
    });

    // The credential Hasura sent is the one the route's guard accepts.
    process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED = "true";
    const response = await POST(request({}, delivered[0].authorization));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ outcome: "advanced" });
  });
});
// #endregion

// #region Cron mode against the real database
describe("World ID analytics [cron mode]", () => {
  it("rebuilds the trailing window once the flag is on", async () => {
    await seedOneVerificationPerSource();
    process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED = "true";

    const response = await POST(request({}));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      outcome: "advanced",
      days: 1,
      total: "2",
    });
    expect(await rolledCounts()).toEqual({
      legacy: [{ unique_count: "1" }],
      v4: [{ unique_count: "1" }],
    });
  });

  it.each([
    ["unset", undefined],
    ["false", "false"],
    ["TRUE", "TRUE"],
    ["1", "1"],
    ["true with whitespace", " true"],
  ])("stays fail-closed when the flag is %s", async (_label, value) => {
    await seedOneVerificationPerSource();
    if (value === undefined) {
      delete process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED;
    } else {
      process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED = value;
    }

    const response = await POST(request({}));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      outcome: "disabled",
    });
    // Raw rows are seeded, so an untouched rollup proves the database was
    // never reached at all.
    expect(await rolledRowCount()).toBe(0);
  });
});
// #endregion

// #region Dated mode against the real database
describe("World ID analytics [dated mode]", () => {
  it("backfills a dated range with the rollout flag still off", async () => {
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_dated_bypass",
      createdAt: daysAgoNoon(10),
    });
    await insertV4Nullifier(pool, {
      id: "nullifier_v4_dated_bypass",
      createdAt: daysAgoNoon(10),
    });

    const response = await POST(
      request({ from_date: utcDate(10), to_date: utcDate(10) }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      chunks: 1,
      failed_ranges: [],
    });
    expect(await rolledCounts()).toEqual({
      legacy: [{ unique_count: "1" }],
      v4: [{ unique_count: "1" }],
    });
  });

  it("covers a multi-chunk range end to end", async () => {
    for (const daysAgo of [24, 14, 4]) {
      await insertV3Nullifier(pool, {
        id: `nullifier_v3_multi_${daysAgo}`,
        createdAt: daysAgoNoon(daysAgo),
      });
    }

    const response = await POST(
      request({
        from_date: utcDate(24),
        to_date: utcDate(0),
        chunk_days: 10,
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      chunks: 3,
      failed_ranges: [],
    });
    expect(await rolledLegacyDates()).toEqual([
      utcDate(24),
      utcDate(14),
      utcDate(4),
    ]);
  });

  it("reports a failed chunk, keeps the others, and heals on re-POST", async () => {
    for (const daysAgo of [24, 14, 4]) {
      await insertV3Nullifier(pool, {
        id: `nullifier_v3_heal_${daysAgo}`,
        createdAt: daysAgoNoon(daysAgo),
      });
    }
    await pool.query(`
      CREATE FUNCTION public.contract_fail_v3_analytics_chunk()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF NEW.date_utc = '${utcDate(14)}'::date THEN
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

    const response = await POST(
      request({
        from_date: utcDate(24),
        to_date: utcDate(0),
        chunk_days: 10,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.chunks).toBe(3);
    expect(body.failed_ranges).toEqual([
      {
        from_date: utcDate(14),
        to_date: utcDate(5),
        error: expect.any(String),
      },
    ]);
    // The failed chunk's transaction rolled back alone; its neighbors landed.
    expect(await rolledLegacyDates()).toEqual([utcDate(24), utcDate(4)]);
    expect(loggerError).toHaveBeenCalledTimes(1);

    await removeChunkSabotage();
    const retry = await POST(
      request({ from_date: utcDate(14), to_date: utcDate(5) }),
    );

    expect(await retry.json()).toEqual({
      success: true,
      chunks: 1,
      failed_ranges: [],
    });
    expect(await rolledLegacyDates()).toEqual([
      utcDate(24),
      utcDate(14),
      utcDate(4),
    ]);
  });

  it("rejects an over-wide range before touching the database", async () => {
    const response = await POST(
      request({ from_date: utcDate(100), to_date: utcDate(0) }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      success: false,
      error: "range must be at most 92 days per call; split it",
    });
    expect(await rolledRowCount()).toBe(0);
  });
});
// #endregion
