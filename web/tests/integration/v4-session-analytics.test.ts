import { ApolloClient, gql } from "@apollo/client";
import { Pool } from "pg";
import { integrationDBClean, integrationDBExecuteQuery } from "./setup";
import {
  getAPIPublicClient,
  getAPIServiceClient,
  getAPIUserClient,
} from "./test-utils";

// #region Test Data
const rpOne = "rp_session00000001";
const rpTwo = "rp_session00000002";

const rollupV4Analytics = gql`
  mutation RollupV4Analytics {
    rollup_v4_analytics {
      key
      timestamp_value
    }
  }
`;

const pruneSessionEvents = gql`
  mutation PruneSessionVerificationEvents {
    prune_session_verifications {
      key
      timestamp_value
    }
  }
`;

const runRollup = async () => {
  const client = await getAPIServiceClient();
  const result = await client.mutate<any>({ mutation: rollupV4Analytics });
  return { rows: result.data?.rollup_v4_analytics ?? [] };
};

const runPrune = async () => {
  const client = await getAPIServiceClient();
  const result = await client.mutate<any>({ mutation: pruneSessionEvents });
  return { rows: result.data?.prune_session_verifications ?? [] };
};

const expectGraphqlDenied = async (
  operation: Promise<unknown>,
  field: string,
) => {
  let error: any;
  try {
    await operation;
  } catch (caught) {
    error = caught;
  }

  expect(error).toBeDefined();
  const messages = error?.errors?.map(
    (item: { message?: string }) => item.message,
  ) ?? [error?.message];
  expect(messages.join(" ")).toMatch(
    new RegExp(`field '${field}' not found|no mutations exist`),
  );
};

const selectSessionEvents = gql`
  query SelectSessionVerificationEvents {
    session_verification_v4 {
      id
    }
  }
`;

const selectSessionDailies = gql`
  query SelectSessionVerificationDailies {
    session_v4_stats_daily {
      rp_id
      environment
      date_utc
      sessions
      successful_results
    }
  }
`;

const insertSessionEvent = gql`
  mutation InsertSessionVerificationEvent(
    $object: session_verification_v4_insert_input!
  ) {
    insert_session_verification_v4(objects: [$object]) {
      affected_rows
    }
  }
`;

const insertSessionDaily = gql`
  mutation InsertSessionVerificationDaily {
    insert_session_v4_stats_daily_one(
      object: {
        rp_id: "rp_permission"
        environment: "production"
        date_utc: "2026-07-01"
        sessions: 1
        successful_results: 1
      }
    ) {
      rp_id
    }
  }
`;

const eventVariables = {
  object: {
    environment: "production",
    rp_id: rpOne,
    session_id: "permission-test",
    successful_results: 1,
  },
};
// #endregion

beforeEach(integrationDBClean);

// #region Session rollup
describe("v4 session analytics [rollup]", () => {
  it("matches the canonical UTC rp-environment-day aggregation for both measures", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.session_verification_v4
        (rp_id, environment, session_id, successful_results, created_at)
      VALUES
        ('${rpOne}', 'production', 'midnight-before', 1,
          '2026-07-27 23:59:59+00'),
        ('${rpOne}', 'production', 'midnight-after', 3,
          '2026-07-28 00:00:01+00'),
        ('${rpOne}', 'production', 'same-day', 2,
          '2026-07-28 12:00:00+00'),
        ('${rpOne}', 'staging', 'staging', 4,
          '2026-07-28 13:00:00+00'),
        ('${rpTwo}', 'production', 'other-rp', 5,
          '2026-07-28 14:00:00+00'),
        ('${rpTwo}', 'production', 'inside-cutoff', 99,
          now() - interval '4 minutes');
    `);

    await runRollup();
    const comparison = await integrationDBExecuteQuery(`
      SELECT
        COALESCE(
          jsonb_agg(to_jsonb(actual)
            ORDER BY rp_id, environment, date_utc),
          '[]'::jsonb
        ) = (
          SELECT COALESCE(
            jsonb_agg(to_jsonb(expected)
              ORDER BY rp_id, environment, date_utc),
            '[]'::jsonb
          )
          FROM (
            SELECT
              rp_id,
              environment,
              (created_at AT TIME ZONE 'UTC')::date AS date_utc,
              count(*)::bigint AS sessions,
              sum(successful_results)::bigint AS successful_results
            FROM public.session_verification_v4
            WHERE created_at < now() - interval '5 minutes'
            GROUP BY 1, 2, 3
          ) expected
        ) AS equal
      FROM public.session_v4_stats_daily actual;
    `);

    expect(comparison.rows[0].equal).toBe(true);
  });

  it("recovers every surviving session day after a watermark stall over 28 days", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.v4_analytics_state (key, timestamp_value)
      VALUES
        ('processed_through', now() - interval '40 days'),
        ('pruned_through', now() - interval '50 days');

      INSERT INTO public.session_verification_v4
        (rp_id, environment, session_id, successful_results, created_at)
      VALUES
        ('${rpOne}', 'production', 'stalled-39d', 1,
          now() - interval '39 days'),
        ('${rpOne}', 'production', 'stalled-34d', 2,
          now() - interval '34 days');
    `);

    await runRollup();
    const result = await integrationDBExecuteQuery(`
      SELECT
        count(*)::int AS days,
        sum(sessions)::int AS sessions,
        sum(successful_results)::int AS successful_results,
        min(date_utc) =
          ((now() - interval '39 days') AT TIME ZONE 'UTC')::date
          AS includes_oldest_stalled_day
      FROM public.session_v4_stats_daily
      WHERE rp_id = '${rpOne}';
    `);

    expect(result.rows[0]).toEqual({
      days: 2,
      sessions: 2,
      successful_results: 3,
      includes_oldest_stalled_day: true,
    });
  });

  it("clamps a forced full rebuild above the partial prune day", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.v4_analytics_state (key, timestamp_value)
      VALUES (
        'pruned_through',
        date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
          - interval '20 days' + interval '12 hours'
      );

      INSERT INTO public.session_v4_stats_daily
        (rp_id, environment, date_utc, sessions, successful_results)
      SELECT
        '${rpOne}',
        'production',
        (timestamp_value AT TIME ZONE 'UTC')::date,
        17,
        29
      FROM public.v4_analytics_state
      WHERE key = 'pruned_through';

      INSERT INTO public.session_verification_v4
        (rp_id, environment, session_id, successful_results, created_at)
      SELECT
        '${rpOne}',
        'production',
        'after-prune-floor',
        2,
        (
          (timestamp_value AT TIME ZONE 'UTC')::date + 1
        )::timestamp AT TIME ZONE 'UTC' + interval '12 hours'
      FROM public.v4_analytics_state
      WHERE key = 'pruned_through';
    `);

    await runRollup();
    const result = await integrationDBExecuteQuery(`
      SELECT sessions, successful_results
      FROM public.session_v4_stats_daily
      WHERE rp_id = '${rpOne}'
      ORDER BY date_utc;
    `);

    expect(result.rows).toEqual([
      { sessions: "17", successful_results: "29" },
      { sessions: "1", successful_results: "2" },
    ]);
  });
});
// #endregion

// #region Session retention
describe("v4 session analytics [retention]", () => {
  it("uses the 30-day threshold for a recent watermark and keeps the strict boundary", async () => {
    const pool = new Pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`
        INSERT INTO public.v4_analytics_state (key, timestamp_value)
        VALUES ('processed_through', now());

        INSERT INTO public.session_verification_v4
          (rp_id, environment, session_id, successful_results, created_at)
        VALUES
          ('${rpOne}', 'production', 'below-30d', 1,
            now() - interval '30 days 1 second'),
          ('${rpOne}', 'production', 'at-30d', 1,
            now() - interval '30 days'),
          ('${rpOne}', 'production', 'recent-20d', 1,
            now() - interval '20 days');
      `);

      const pruneResult = await client.query(
        "SELECT key, timestamp_value FROM public.prune_session_verifications()",
      );
      const inside = await client.query(`
        SELECT
          array_agg(session_id ORDER BY session_id) AS remaining,
          (
            SELECT timestamp_value = now() - interval '30 days'
            FROM public.v4_analytics_state
            WHERE key = 'pruned_through'
          ) AS floor_is_30_days
        FROM public.session_verification_v4;
      `);

      expect(pruneResult.rows).toHaveLength(1);
      expect(inside.rows[0]).toEqual({
        remaining: ["at-30d", "recent-20d"],
        floor_is_30_days: true,
      });

      await client.query("ROLLBACK");
    } finally {
      await client.query("ROLLBACK").catch(() => undefined);
      client.release();
      await pool.end();
    }
  });

  it("does not prune or write a floor when the processed watermark is absent", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.session_verification_v4
        (rp_id, environment, session_id, successful_results, created_at)
      VALUES (
        '${rpOne}',
        'production',
        'forced-rebuild-window',
        1,
        now() - interval '31 days'
      );
    `);

    const pruneResult = await runPrune();
    const result = await integrationDBExecuteQuery(`
      SELECT
        (SELECT count(*)::int
         FROM public.session_verification_v4) AS events,
        (SELECT count(*)::int
         FROM public.v4_analytics_state
         WHERE key = 'pruned_through') AS floors;
    `);

    expect(pruneResult.rows).toEqual([]);
    expect(result.rows[0]).toEqual({ events: 1, floors: 0 });
  });

  it("preserves the stalled window when the watermark is over 30 days behind", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.v4_analytics_state (key, timestamp_value)
      VALUES ('processed_through', now() - interval '40 days');

      INSERT INTO public.v4_analytics_state (key, timestamp_value)
      SELECT
        'pruned_through',
        timestamp_value - interval '25 hours'
      FROM public.v4_analytics_state
      WHERE key = 'processed_through';

      INSERT INTO public.session_verification_v4
        (rp_id, environment, session_id, successful_results, created_at)
      VALUES
        ('${rpOne}', 'production', 'stalled-old', 1,
          now() - interval '35 days'),
        ('${rpOne}', 'production', 'stalled-new', 1,
          now() - interval '20 days');
    `);
    const before = await integrationDBExecuteQuery(`
      SELECT timestamp_value
      FROM public.v4_analytics_state
      WHERE key = 'pruned_through';
    `);

    await runPrune();
    const after = await integrationDBExecuteQuery(`
      SELECT
        (SELECT count(*)::int
         FROM public.session_verification_v4) AS events,
        (SELECT timestamp_value
         FROM public.v4_analytics_state
         WHERE key = 'pruned_through') AS pruned_through;
    `);

    expect(after.rows[0]).toEqual({
      events: 2,
      pruned_through: before.rows[0].timestamp_value,
    });
  });

  it("does not move a newer prune floor backwards during a forced rebuild", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.v4_analytics_state (key, timestamp_value)
      VALUES
        ('processed_through', now() - interval '60 days'),
        ('pruned_through', now() - interval '10 days');

      INSERT INTO public.session_v4_stats_daily
        (rp_id, environment, date_utc, sessions, successful_results)
      SELECT
        '${rpOne}',
        'production',
        (timestamp_value AT TIME ZONE 'UTC')::date,
        41,
        43
      FROM public.v4_analytics_state
      WHERE key = 'pruned_through';
    `);
    const before = await integrationDBExecuteQuery(`
      SELECT timestamp_value
      FROM public.v4_analytics_state
      WHERE key = 'pruned_through';
    `);

    await runPrune();
    await integrationDBExecuteQuery(`
      DELETE FROM public.v4_analytics_state
      WHERE key = 'processed_through';
    `);
    await runRollup();
    const after = await integrationDBExecuteQuery(`
      SELECT
        (SELECT timestamp_value
         FROM public.v4_analytics_state
         WHERE key = 'pruned_through') AS pruned_through,
        (SELECT sessions
         FROM public.session_v4_stats_daily
         WHERE rp_id = '${rpOne}') AS sessions;
    `);

    expect(after.rows[0]).toEqual({
      pruned_through: before.rows[0].timestamp_value,
      sessions: "41",
    });
  });

  it("deletes exactly below the gated threshold and rolls back events and floor together", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.v4_analytics_state (key, timestamp_value)
      VALUES ('processed_through', now() - interval '60 days');

      INSERT INTO public.session_verification_v4
        (rp_id, environment, session_id, successful_results, created_at)
      SELECT
        '${rpOne}',
        'production',
        boundary.session_id,
        1,
        processed.timestamp_value - interval '25 hours'
          + boundary.delta
      FROM public.v4_analytics_state processed
      CROSS JOIN (
        VALUES
          ('below-threshold', interval '-1 second'),
          ('at-threshold', interval '0 seconds'),
          ('above-threshold', interval '1 second')
      ) AS boundary(session_id, delta)
      WHERE processed.key = 'processed_through';
    `);

    const pool = new Pool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const pruneResult = await client.query(
        "SELECT key, timestamp_value FROM public.prune_session_verifications()",
      );
      const inside = await client.query(`
        SELECT
          array_agg(session_id ORDER BY session_id) AS remaining,
          (
            SELECT timestamp_value
            FROM public.v4_analytics_state
            WHERE key = 'pruned_through'
          ) AS pruned_through,
          (
            SELECT timestamp_value - interval '25 hours'
            FROM public.v4_analytics_state
            WHERE key = 'processed_through'
          ) AS expected_threshold
        FROM public.session_verification_v4;
      `);

      expect(pruneResult.rows).toHaveLength(1);
      expect(inside.rows[0]).toEqual({
        remaining: ["above-threshold", "at-threshold"],
        pruned_through: inside.rows[0].expected_threshold,
        expected_threshold: inside.rows[0].expected_threshold,
      });

      await client.query("ROLLBACK");
    } finally {
      await client.query("ROLLBACK").catch(() => undefined);
      client.release();
      await pool.end();
    }

    const afterRollback = await integrationDBExecuteQuery(`
      SELECT
        (SELECT count(*)::int
         FROM public.session_verification_v4) AS events,
        (SELECT count(*)::int
         FROM public.v4_analytics_state
         WHERE key = 'pruned_through') AS floors;
    `);
    expect(afterRollback.rows[0]).toEqual({ events: 3, floors: 0 });
  });

  it("makes prune and rollup quiet no-ops while their shared lock is held", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO public.v4_analytics_state (key, timestamp_value)
      VALUES ('processed_through', now() - interval '1 day');

      INSERT INTO public.session_verification_v4
        (rp_id, environment, session_id, successful_results, created_at)
      VALUES (
        '${rpOne}',
        'production',
        'eligible-after-unlock',
        1,
        now() - interval '31 days'
      );
    `);
    const before = await integrationDBExecuteQuery(`
      SELECT timestamp_value
      FROM public.v4_analytics_state
      WHERE key = 'processed_through';
    `);

    const pool = new Pool();
    const lockClient = await pool.connect();
    try {
      await lockClient.query("SELECT pg_advisory_lock(533214, 43)");

      const rollup = await runRollup();
      const prune = await runPrune();
      const state = await integrationDBExecuteQuery(`
        SELECT key, timestamp_value
        FROM public.v4_analytics_state
        ORDER BY key;
      `);

      expect(rollup.rows).toEqual([]);
      expect(prune.rows).toEqual([]);
      expect(state.rows).toEqual([
        {
          key: "processed_through",
          timestamp_value: before.rows[0].timestamp_value,
        },
      ]);
    } finally {
      await lockClient.query("SELECT pg_advisory_unlock(533214, 43)");
      lockClient.release();
      await pool.end();
    }

    expect((await runPrune()).rows).toHaveLength(1);
    const remaining = await integrationDBExecuteQuery(
      "SELECT count(*)::int AS count FROM public.session_verification_v4",
    );
    expect(remaining.rows[0].count).toBe(0);
  });
});
// #endregion

// #region Hasura permission surface
describe("v4 session analytics [permissions]", () => {
  it("lets the service role insert events, select dailies, and invoke pruning", async () => {
    const service = await getAPIServiceClient();

    const inserted = await service.mutate<any>({
      mutation: insertSessionEvent,
      variables: eventVariables,
    });
    const selected = await service.query<any>({ query: selectSessionDailies });
    const pruned = await service.mutate<any>({
      mutation: pruneSessionEvents,
    });

    expect(inserted.data?.insert_session_verification_v4?.affected_rows).toBe(
      1,
    );
    expect(selected.data?.session_v4_stats_daily).toEqual([]);
    expect(pruned.data?.prune_session_verifications).toEqual([]);
  });

  it("keeps service event reads and daily writes unavailable", async () => {
    const service = await getAPIServiceClient();

    await expectGraphqlDenied(
      service.query({ query: selectSessionEvents }),
      "session_verification_v4",
    );
    await expectGraphqlDenied(
      service.mutate({ mutation: insertSessionDaily }),
      "insert_session_v4_stats_daily_one",
    );
  });

  it.each([
    [
      "user",
      async () => getAPIUserClient(),
      selectSessionEvents,
      "session_verification_v4",
    ],
    [
      "public",
      async () => getAPIPublicClient(),
      selectSessionDailies,
      "session_v4_stats_daily",
    ],
  ])(
    "denies a representative session-table read to the %s role",
    async (_role, getClient, document, field) => {
      const client: ApolloClient = await getClient();

      await expectGraphqlDenied(client.query({ query: document }), field);
    },
  );

  it("keeps event insertion and prune invocation off user-facing roles", async () => {
    const user = await getAPIUserClient();
    const publicClient = await getAPIPublicClient();

    await expectGraphqlDenied(
      user.mutate({
        mutation: insertSessionEvent,
        variables: eventVariables,
      }),
      "insert_session_verification_v4",
    );
    await expectGraphqlDenied(
      publicClient.mutate({ mutation: pruneSessionEvents }),
      "prune_session_verifications",
    );
  });
});
// #endregion
