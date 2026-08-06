import { NextRequest } from "next/server";
import { createServer, type IncomingMessage, type Server } from "node:http";
import { Pool } from "pg";
// Entry through the app-router re-export, exactly as production routes it.
import { POST } from "../../app/api/%5Frollup-world-id-analytics/route";
import {
  fixture,
  insertV3Nullifier,
  insertV4Nullifier,
  resetFixture,
  seedFixture,
} from "./fresh-stack-fixture";
import {
  commandOutput,
  requiredEnv,
  runSqlOperation,
} from "./run-sql-operation";

// #region Mocks
// Only the log sink is mocked; route, GraphQL client, service JWT, Hasura and
// Postgres are all real.
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const pool = new Pool();

const request = (body?: unknown) =>
  new NextRequest("http://localhost:3000/api/_rollup-world-id-analytics", {
    method: "POST",
    headers: { authorization: requiredEnv("INTERNAL_ENDPOINTS_SECRET") },
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

const readAppDaily = async (
  appId: string,
  environment: string,
  fromDaysAgo: number,
  toDaysAgo: number,
) =>
  (
    await pool.query<{ date_utc: string; unique_count: string }>(
      `SELECT date_utc::text, unique_count::text
         FROM public.world_id_analytics_app_daily($1, $2, $3::date, $4::date)`,
      [appId, environment, utcDate(fromDaysAgo), utcDate(toDaysAgo)],
    )
  ).rows;

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

const runParityGate = () => runSqlOperation("backfill-and-validate.sql");

const expectParityGatePasses = () => {
  const gate = runParityGate();
  expect({
    error: gate.error,
    output: commandOutput(gate),
    status: gate.status,
  }).toEqual(expect.objectContaining({ error: undefined, status: 0 }));
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
  delete process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED;
  await resetFixture(pool);
  await seedFixture(pool);
});

afterEach(() => {
  delete process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED;
});

afterAll(async () => {
  await resetFixture(pool);
  await pool.end();
});

jest.setTimeout(150_000);

// #region Release runbook end to end
describe("World ID analytics [release runbook end to end]", () => {
  it("boots dark, backfills history, validates parity, serves reads, then runs live off the real cron", async () => {
    // ── 1. Deployed dark: the cron tick is a no-op before the flag flips.
    const darkTick = await POST(request({}));
    expect(await darkTick.json()).toEqual({
      success: true,
      outcome: "disabled",
    });
    expect(await rolledRowCount()).toBe(0);

    // ── 2. History exists across ~200 days, all apps and environments.
    const seeds = [
      { count: 2, daysAgo: 200, insert: "v3" as const },
      { count: 3, daysAgo: 150, insert: "v4" as const },
      { count: 1, daysAgo: 100, insert: "v3" as const },
      { count: 1, daysAgo: 100, insert: "v4" as const },
      { count: 1, daysAgo: 10, insert: "v3" as const },
    ];
    for (const seed of seeds) {
      for (let i = 0; i < seed.count; i += 1) {
        if (seed.insert === "v3") {
          await insertV3Nullifier(pool, {
            id: `nullifier_v3_e2e_${seed.daysAgo}_${i}`,
            createdAt: daysAgoNoon(seed.daysAgo),
          });
        } else {
          await insertV4Nullifier(pool, {
            id: `nullifier_v4_e2e_${seed.daysAgo}_${i}`,
            createdAt: daysAgoNoon(seed.daysAgo),
          });
        }
      }
    }
    // Environment separation probes: a staging app's legacy action, a
    // staging-environment v4 action registered to the production app, and a
    // v4-only app.
    await insertV3Nullifier(pool, {
      actionId: fixture.stagingV3ActionId,
      id: "nullifier_v3_e2e_staging_app",
      createdAt: daysAgoNoon(60),
    });
    await insertV4Nullifier(pool, {
      actionId: fixture.productionStagingV4ActionId,
      id: "nullifier_v4_e2e_staging_env_1",
      createdAt: daysAgoNoon(60),
    });
    await insertV4Nullifier(pool, {
      actionId: fixture.productionStagingV4ActionId,
      id: "nullifier_v4_e2e_staging_env_2",
      createdAt: daysAgoNoon(60),
    });
    await insertV4Nullifier(pool, {
      actionId: fixture.v4OnlyActionId,
      id: "nullifier_v4_e2e_v4_only",
      createdAt: daysAgoNoon(30),
    });

    // ── 3. Operator backfill: three ≤92-day POSTs cover the whole history.
    for (const [fromDaysAgo, toDaysAgo, chunks] of [
      [210, 120, 10],
      [119, 30, 9],
      [29, 0, 3],
    ] as const) {
      const response = await POST(
        request({
          from_date: utcDate(fromDaysAgo),
          to_date: utcDate(toDaysAgo),
          chunk_days: 10,
        }),
      );
      expect(await response.json()).toEqual({
        success: true,
        chunks,
        failed_ranges: [],
      });
    }

    // ── 4. The parity gate signs off the backfill.
    expectParityGatePasses();

    // ── 5. The read function serves every app/environment correctly.
    expect(
      await readAppDaily(fixture.productionAppId, "production", 210, 0),
    ).toEqual([
      { date_utc: utcDate(200), unique_count: "2" },
      { date_utc: utcDate(150), unique_count: "3" },
      { date_utc: utcDate(100), unique_count: "2" },
      { date_utc: utcDate(10), unique_count: "1" },
    ]);
    // The staging-environment v4 rows belong to the production app but must
    // only answer a staging query.
    expect(
      await readAppDaily(fixture.productionAppId, "staging", 210, 0),
    ).toEqual([{ date_utc: utcDate(60), unique_count: "2" }]);
    expect(await readAppDaily(fixture.stagingAppId, "staging", 210, 0)).toEqual(
      [{ date_utc: utcDate(60), unique_count: "1" }],
    );
    expect(
      await readAppDaily(fixture.v4OnlyAppId, "production", 210, 0),
    ).toEqual([{ date_utc: utcDate(30), unique_count: "1" }]);
    // Date bounds clip the series.
    expect(
      await readAppDaily(fixture.productionAppId, "production", 160, 90),
    ).toEqual([
      { date_utc: utcDate(150), unique_count: "3" },
      { date_utc: utcDate(100), unique_count: "2" },
    ]);

    // ── 6. Flag on: a real Hasura-delivered webhook drives the live tick
    // through the actual route handler.
    process.env.WORLD_ID_ANALYTICS_ROLLUP_ENABLED = "true";

    const deliveries: Array<{ body: any; status: number }> = [];
    let delivered: (() => void) | undefined;
    const firstDelivery = new Promise<void>((resolve) => {
      delivered = resolve;
    });
    const bridge: Server = createServer(
      (message: IncomingMessage, response) => {
        const chunks: Buffer[] = [];
        message.on("data", (chunk: Buffer) => chunks.push(chunk));
        message.on("end", () => {
          void (async () => {
            const routeResponse = await POST(
              new NextRequest(
                "http://localhost:3000/api/_rollup-world-id-analytics",
                {
                  method: "POST",
                  headers: {
                    authorization: message.headers.authorization ?? "",
                  },
                  body: Buffer.concat(chunks).toString("utf8") || undefined,
                },
              ),
            );
            const body = await routeResponse.json();
            deliveries.push({ body, status: routeResponse.status });
            response.writeHead(routeResponse.status, {
              "content-type": "application/json",
            });
            response.end(JSON.stringify(body));
            delivered?.();
          })();
        });
      },
    );

    try {
      await new Promise<void>((resolve) => bridge.listen(0, resolve));
      const address = bridge.address();
      if (!address || typeof address === "string") {
        throw new Error("bridge server did not bind a port");
      }

      await metadataRequest({
        type: "create_scheduled_event",
        args: {
          webhook: `http://host.docker.internal:${address.port}/rollup`,
          schedule_at: new Date().toISOString(),
          payload: {},
          headers: [
            {
              name: "Authorization",
              value_from_env: "INTERNAL_ENDPOINTS_SECRET",
            },
          ],
          retry_conf: { num_retries: 0, timeout_seconds: 10 },
          comment: "World ID analytics end-to-end live tick",
        },
      });

      await Promise.race([
        firstDelivery,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Hasura never delivered the live tick")),
            90_000,
          ),
        ),
      ]);
    } finally {
      await new Promise<void>((resolve) => bridge.close(() => resolve()));
    }

    expect(deliveries[0].status).toBe(200);
    expect(deliveries[0].body).toMatchObject({
      success: true,
      outcome: "advanced",
    });

    // ── 7. Late-arriving data heals on the next tick.
    const lateCreatedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const lateDate = lateCreatedAt.toISOString().slice(0, 10);
    await insertV3Nullifier(pool, {
      id: "nullifier_v3_e2e_late",
      createdAt: lateCreatedAt.toISOString(),
    });

    expect(await (await POST(request({}))).json()).toMatchObject({
      outcome: "advanced",
    });
    expect(
      await readAppDaily(fixture.productionAppId, "production", 2, 0),
    ).toContainEqual({ date_utc: lateDate, unique_count: "1" });

    // ── 8. A deleted raw row is swept back out by the following tick.
    await pool.query("DELETE FROM public.nullifier WHERE id = $1", [
      "nullifier_v3_e2e_late",
    ]);
    await POST(request({}));
    expect(
      await readAppDaily(fixture.productionAppId, "production", 2, 0),
    ).not.toContainEqual({ date_utc: lateDate, unique_count: "1" });

    // ── 9. Steady state still satisfies the parity gate.
    expectParityGatePasses();
  });
});
// #endregion
