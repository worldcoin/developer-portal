import { integrationDBClean, integrationDBExecuteQuery } from "./setup";

jest.setTimeout(30_000);

type JobRow = {
  job: string;
  status: string;
  items: string;
  repaired: string;
  alerts: string;
  detail: string | null;
};

type MeasureRow = {
  verifications: string;
  unique_verifications: string;
  repeated_verifications: string;
};

type V4Fixture = {
  appId: string;
  rpId: string;
};

type AtomicMutationResponse = {
  data?: {
    insert_nullifier_v4_one: { id: string } | null;
    update_nullifier_v4: {
      affected_rows: number;
      returning: Array<{ uses: number }>;
    };
  };
  errors?: Array<{ message: string }>;
};

const v4TeamId = "team_0000000000000000000000000004";
const v4RpId = "rp_0000000000000001";

const analyticsCleanupSql = `
  DELETE FROM nullifier_v4_uses_seen;
  DELETE FROM nullifier_v4;
  DELETE FROM action_v4;
  DELETE FROM rp_registration;
  DELETE FROM nullifier_uses_seen;
  DELETE FROM app_stats;
  DELETE FROM app_daily_users;
  DELETE FROM action_verification_stats_daily;
  DELETE FROM action_verification_stats_total;
  DELETE FROM app_verification_stats_daily;
  DELETE FROM app_verification_stats_total;
  DELETE FROM rollup_watermark;
  DELETE FROM verification_analytics_config;
  DELETE FROM verification_reconciliation_state;
`;

const queryOne = async <T>(query: string, values?: unknown[]): Promise<T> => {
  const result = await integrationDBExecuteQuery(query, values);
  return result.rows[0] as T;
};

const createApp = async (
  teamId: string,
  name: string,
  isStaging: boolean,
): Promise<string> => {
  const row = await queryOne<{ id: string }>(
    `
      INSERT INTO app (team_id, name, is_staging)
      VALUES ($1, $2, $3)
      RETURNING id;
    `,
    [teamId, name, isStaging],
  );

  return row.id;
};

const runLegacySeed = async (): Promise<JobRow> => {
  const results = (await integrationDBExecuteQuery(`
    BEGIN;
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    SELECT * FROM seed_legacy_verification_stats();
    COMMIT;
  `)) as unknown as Array<{ rows: JobRow[] }>;

  return results[2].rows[0];
};

const runV4Seed = async (): Promise<JobRow> => {
  const results = (await integrationDBExecuteQuery(`
    BEGIN;
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    SELECT * FROM seed_v4_verification_stats();
    COMMIT;
  `)) as unknown as Array<{ rows: JobRow[] }>;

  return results[2].rows[0];
};

const runRollup = async (secondsAhead: number): Promise<JobRow> =>
  queryOne<JobRow>(
    `
      SELECT *
      FROM rollup_verification_stats(
        now() + make_interval(secs => $1)
      );
    `,
    [secondsAhead],
  );

// The function asserts REPEATABLE READ (§12.3); in production the route reaches it
// through the repeatable-read Hasura source.
const runReconciliation = async (batchSize: number): Promise<JobRow> => {
  const results = (await integrationDBExecuteQuery(`
    BEGIN;
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    SELECT * FROM reconcile_verification_stats(${Number(batchSize)});
    COMMIT;
  `)) as unknown as Array<{ rows: JobRow[] }>;

  return results[2].rows[0];
};

const expectJob = (
  row: JobRow,
  expected: {
    job: string;
    status: string;
    items?: number;
    repaired?: number;
    alerts?: number;
  },
) => {
  expect(row.job).toBe(expected.job);
  expect(row.status).toBe(expected.status);

  if (expected.items !== undefined) {
    expect(Number(row.items)).toBe(expected.items);
  }
  if (expected.repaired !== undefined) {
    expect(Number(row.repaired)).toBe(expected.repaired);
  }
  if (expected.alerts !== undefined) {
    expect(Number(row.alerts)).toBe(expected.alerts);
  }
};

const expectMeasures = (
  row: MeasureRow | undefined,
  verifications: number,
  uniqueVerifications: number,
  repeatedVerifications: number,
) => {
  expect(row).toBeDefined();
  expect(Number(row?.verifications)).toBe(verifications);
  expect(Number(row?.unique_verifications)).toBe(uniqueVerifications);
  expect(Number(row?.repeated_verifications)).toBe(repeatedVerifications);
};

const expectMeasureDelta = (
  before: MeasureRow,
  after: MeasureRow,
  verifications: number,
  uniqueVerifications: number,
  repeatedVerifications: number,
) => {
  expect(Number(after.verifications) - Number(before.verifications)).toBe(
    verifications,
  );
  expect(
    Number(after.unique_verifications) - Number(before.unique_verifications),
  ).toBe(uniqueVerifications);
  expect(
    Number(after.repeated_verifications) -
      Number(before.repeated_verifications),
  ).toBe(repeatedVerifications);
};

const getProdActionTotal = async (): Promise<MeasureRow> =>
  queryOne<MeasureRow>(`
    SELECT verifications, unique_verifications, repeated_verifications
    FROM action_verification_stats_total
    WHERE action_id = 'action_v4_prod1'
      AND source = 'v4'
      AND environment = 'production';
  `);

const getProdAppTotal = async (appId: string): Promise<MeasureRow> =>
  queryOne<MeasureRow>(
    `
      SELECT verifications, unique_verifications, repeated_verifications
      FROM app_verification_stats_total
      WHERE app_id = $1
        AND source = 'v4'
        AND environment = 'production';
    `,
    [appId],
  );

const createCanonicalFixture = async (): Promise<V4Fixture> => {
  await integrationDBExecuteQuery(
    "INSERT INTO team (id, name) VALUES ($1, 'V4 Analytics T');",
    [v4TeamId],
  );

  const appId = await createApp(v4TeamId, "V4 Analytics Prod", false);

  await integrationDBExecuteQuery(`
    BEGIN;

    INSERT INTO rp_registration (
      rp_id,
      app_id,
      mode,
      signer_address
    )
    VALUES (
      '${v4RpId}',
      '${appId}',
      'managed',
      '0x0000000000000000000000000000000000000001'
    );

    INSERT INTO action_v4 (
      id,
      rp_id,
      action,
      environment
    )
    VALUES
      (
        'action_v4_prod1',
        '${v4RpId}',
        'production-action',
        'production'
      ),
      (
        'action_v4_stg1',
        '${v4RpId}',
        'staging-action',
        'staging'
      );

    INSERT INTO nullifier_v4 (
      id,
      action_v4_id,
      nullifier,
      uses,
      created_at,
      updated_at
    )
    VALUES
      (
        'nullifier_v4_111',
        'action_v4_prod1',
        111,
        1,
        now() - interval '30 days',
        now() - interval '30 days'
      ),
      (
        'nullifier_v4_222',
        'action_v4_prod1',
        222,
        1,
        now() - interval '20 days',
        now() - interval '20 days'
      ),
      (
        'nullifier_v4_333',
        'action_v4_stg1',
        333,
        1,
        now() - interval '10 days',
        now() - interval '10 days'
      );

    COMMIT;
  `);

  return { appId, rpId: v4RpId };
};

const createSeededFixture = async (): Promise<V4Fixture> => {
  const fixture = await createCanonicalFixture();
  await runLegacySeed();
  await runV4Seed();
  return fixture;
};

const addRollupActivity = async () => {
  await integrationDBExecuteQuery(`
    BEGIN;

    INSERT INTO nullifier_v4 (action_v4_id, nullifier, uses)
    VALUES ('action_v4_prod1', 444, 0)
    ON CONFLICT (nullifier) DO NOTHING;

    UPDATE nullifier_v4
    SET uses = uses + 1
    WHERE nullifier = 444
      AND action_v4_id = 'action_v4_prod1';

    INSERT INTO nullifier_v4 (action_v4_id, nullifier, uses)
    VALUES ('action_v4_prod1', 222, 0)
    ON CONFLICT (nullifier) DO NOTHING;

    UPDATE nullifier_v4
    SET uses = uses + 1
    WHERE nullifier = 222
      AND action_v4_id = 'action_v4_prod1';

    COMMIT;
  `);
};

const addReconciliationStrand = async () => {
  await integrationDBExecuteQuery(`
    BEGIN;

    INSERT INTO nullifier_v4 (
      id,
      action_v4_id,
      nullifier,
      uses,
      created_at,
      updated_at
    )
    VALUES (
      'nullifier_v4_555',
      'action_v4_prod1',
      555,
      3,
      now() - interval '40 days',
      now() - interval '30 days'
    );

    INSERT INTO nullifier_v4_uses_seen (
      nullifier_v4_id,
      last_seen_uses,
      last_seen_at
    )
    VALUES (
      'nullifier_v4_555',
      1,
      now() - interval '30 days'
    );

    UPDATE action_verification_stats_total
    SET
      verifications = verifications + 1,
      unique_verifications = unique_verifications + 1
    WHERE action_id = 'action_v4_prod1'
      AND source = 'v4'
      AND environment = 'production';

    UPDATE app_verification_stats_total
    SET
      verifications = verifications + 1,
      unique_verifications = unique_verifications + 1
    WHERE app_id = (
        SELECT r.app_id
        FROM action_v4 a
        JOIN rp_registration r ON r.rp_id = a.rp_id
        WHERE a.id = 'action_v4_prod1'
      )
      AND source = 'v4'
      AND environment = 'production';

    COMMIT;
  `);
};

const createReconciliationFixture = async (): Promise<V4Fixture> => {
  const fixture = await createSeededFixture();
  await addRollupActivity();
  await runRollup(1);
  await addReconciliationStrand();
  await integrationDBExecuteQuery("DELETE FROM action;");
  return fixture;
};

const runAtomicHasuraMutation = async (
  nullifier: number,
): Promise<AtomicMutationResponse> => {
  const graphqlApiUrl = process.env.NEXT_PUBLIC_GRAPHQL_API_URL;
  const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

  if (!graphqlApiUrl || !adminSecret) {
    throw new Error("Hasura integration test environment is not configured");
  }

  const response = await fetch(graphqlApiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hasura-admin-secret": adminSecret,
    },
    body: JSON.stringify({
      query: `
        mutation ($action_v4_id: String!, $nullifier: numeric!) {
          insert_nullifier_v4_one(
            object: {
              action_v4_id: $action_v4_id
              nullifier: $nullifier
              uses: 0
            }
            on_conflict: {
              constraint: nullifier_v4_nullifier_key
              update_columns: []
            }
          ) {
            id
          }
          update_nullifier_v4(
            where: {
              nullifier: { _eq: $nullifier }
              action_v4_id: { _eq: $action_v4_id }
            }
            _inc: { uses: 1 }
          ) {
            affected_rows
            returning {
              uses
            }
          }
        }
      `,
      variables: {
        action_v4_id: "action_v4_prod1",
        nullifier,
      },
    }),
  });

  expect(response.ok).toBe(true);
  return (await response.json()) as AtomicMutationResponse;
};

beforeEach(async () => {
  await integrationDBClean();
  await integrationDBExecuteQuery(analyticsCleanupSql);
});

describe("seed_v4_verification_stats", () => {
  let fixture: V4Fixture;
  let seedResult: JobRow;

  beforeEach(async () => {
    fixture = await createCanonicalFixture();
    await runLegacySeed();
    seedResult = await runV4Seed();
  });

  it("returns applied with all three v4 nullifiers", () => {
    expectJob(seedResult, {
      job: "seed",
      status: "applied",
      items: 3,
    });
  });

  it("writes environment-split lifetime totals at action and app grain", async () => {
    const actionResult = await integrationDBExecuteQuery(`
      SELECT
        action_id,
        environment,
        verifications,
        unique_verifications,
        repeated_verifications
      FROM action_verification_stats_total
      WHERE source = 'v4'
        AND action_id IN ('action_v4_prod1', 'action_v4_stg1')
      ORDER BY action_id;
    `);

    expectMeasures(
      actionResult.rows.find(
        (row: { action_id: string }) => row.action_id === "action_v4_prod1",
      ),
      2,
      2,
      0,
    );
    expectMeasures(
      actionResult.rows.find(
        (row: { action_id: string }) => row.action_id === "action_v4_stg1",
      ),
      1,
      1,
      0,
    );
    expect(
      actionResult.rows.find(
        (row: { action_id: string }) => row.action_id === "action_v4_prod1",
      ).environment,
    ).toBe("production");
    expect(
      actionResult.rows.find(
        (row: { action_id: string }) => row.action_id === "action_v4_stg1",
      ).environment,
    ).toBe("staging");

    const appResult = await integrationDBExecuteQuery(
      `
        SELECT
          environment,
          verifications,
          unique_verifications,
          repeated_verifications
        FROM app_verification_stats_total
        WHERE app_id = $1
          AND source = 'v4'
        ORDER BY environment;
      `,
      [fixture.appId],
    );

    expect(appResult.rows).toHaveLength(2);
    expectMeasures(
      appResult.rows.find(
        (row: { environment: string }) => row.environment === "production",
      ),
      2,
      2,
      0,
    );
    expectMeasures(
      appResult.rows.find(
        (row: { environment: string }) => row.environment === "staging",
      ),
      1,
      1,
      0,
    );
  });

  it("writes honest first-use dailies at both grains", async () => {
    const result = await integrationDBExecuteQuery(`
      SELECT
        n.nullifier::text AS nullifier,
        'action' AS grain,
        d.verifications,
        d.unique_verifications,
        d.repeated_verifications
      FROM nullifier_v4 n
      JOIN action_v4 a ON a.id = n.action_v4_id
      JOIN action_verification_stats_daily d
        ON d.action_id = n.action_v4_id
       AND d.source = 'v4'
       AND d.environment = a.environment::text
       AND d.date = (n.created_at AT TIME ZONE 'UTC')::date

      UNION ALL

      SELECT
        n.nullifier::text AS nullifier,
        'app' AS grain,
        d.verifications,
        d.unique_verifications,
        d.repeated_verifications
      FROM nullifier_v4 n
      JOIN action_v4 a ON a.id = n.action_v4_id
      JOIN rp_registration r ON r.rp_id = a.rp_id
      JOIN app_verification_stats_daily d
        ON d.app_id = r.app_id
       AND d.source = 'v4'
       AND d.environment = a.environment::text
       AND d.date = (n.created_at AT TIME ZONE 'UTC')::date

      ORDER BY nullifier, grain;
    `);

    expect(result.rows).toHaveLength(6);
    for (const nullifier of ["111", "222", "333"]) {
      for (const grain of ["action", "app"]) {
        expectMeasures(
          result.rows.find(
            (row: { nullifier: string; grain: string }) =>
              row.nullifier === nullifier && row.grain === grain,
          ),
          1,
          1,
          0,
        );
      }
    }
  });

  it("snapshots all three v4 row IDs at one use", async () => {
    const result = await integrationDBExecuteQuery(`
      SELECT
        n.id,
        s.nullifier_v4_id,
        s.last_seen_uses
      FROM nullifier_v4 n
      JOIN nullifier_v4_uses_seen s ON s.nullifier_v4_id = n.id
      ORDER BY n.nullifier;
    `);

    expect(
      result.rows.map(
        (row: {
          id: string;
          nullifier_v4_id: string;
          last_seen_uses: string;
        }) => ({
          id: row.id,
          nullifier_v4_id: row.nullifier_v4_id,
          last_seen_uses: Number(row.last_seen_uses),
        }),
      ),
    ).toEqual([
      {
        id: "nullifier_v4_111",
        nullifier_v4_id: "nullifier_v4_111",
        last_seen_uses: 1,
      },
      {
        id: "nullifier_v4_222",
        nullifier_v4_id: "nullifier_v4_222",
        last_seen_uses: 1,
      },
      {
        id: "nullifier_v4_333",
        nullifier_v4_id: "nullifier_v4_333",
        last_seen_uses: 1,
      },
    ]);
  });

  it("skips a second v4 seed call", async () => {
    const secondResult = await runV4Seed();

    expectJob(secondResult, {
      job: "seed",
      status: "skipped_already_completed",
      items: 0,
    });
  });
});

describe("rollup_verification_stats v4 gate and deltas", () => {
  it("applies unique and repeat deltas idempotently and honors the seed gate", async () => {
    await createSeededFixture();
    await addRollupActivity();

    const firstResult = await runRollup(1);
    expectJob(firstResult, {
      job: "rollup",
      status: "applied",
      items: 1,
    });
    expect(firstResult.detail).toBe("legacy=0,v4=1");

    const actionDaily = await queryOne<MeasureRow>(`
      SELECT verifications, unique_verifications, repeated_verifications
      FROM action_verification_stats_daily
      WHERE action_id = 'action_v4_prod1'
        AND source = 'v4'
        AND environment = 'production'
        AND date = (now() AT TIME ZONE 'UTC')::date;
    `);
    expectMeasures(actionDaily, 2, 1, 1);

    const firstTotal = await getProdActionTotal();
    expectMeasures(firstTotal, 4, 3, 1);

    const snapshots = await integrationDBExecuteQuery(`
      SELECT n.nullifier::text AS nullifier, s.last_seen_uses
      FROM nullifier_v4 n
      JOIN nullifier_v4_uses_seen s ON s.nullifier_v4_id = n.id
      WHERE n.nullifier IN (222, 444)
      ORDER BY n.nullifier;
    `);
    expect(
      snapshots.rows.map(
        (row: { nullifier: string; last_seen_uses: string }) => ({
          nullifier: row.nullifier,
          last_seen_uses: Number(row.last_seen_uses),
        }),
      ),
    ).toEqual([
      { nullifier: "222", last_seen_uses: 2 },
      { nullifier: "444", last_seen_uses: 1 },
    ]);

    const appStats = await queryOne<{ count: string }>(
      "SELECT count(*) FROM app_stats;",
    );
    expect(Number(appStats.count)).toBe(0);

    const secondResult = await runRollup(2);
    expectJob(secondResult, {
      job: "rollup",
      status: "applied",
      items: 0,
    });
    expect(secondResult.detail).toBe("legacy=0,v4=0");
    expect(await getProdActionTotal()).toEqual(firstTotal);

    await integrationDBExecuteQuery(`
      BEGIN;

      INSERT INTO nullifier_v4 (action_v4_id, nullifier, uses)
      VALUES ('action_v4_prod1', 111, 0)
      ON CONFLICT (nullifier) DO NOTHING;

      UPDATE nullifier_v4
      SET uses = uses + 1
      WHERE nullifier = 111
        AND action_v4_id = 'action_v4_prod1';

      COMMIT;
    `);
    await integrationDBExecuteQuery(`
      DELETE FROM verification_analytics_config
      WHERE key = 'v4_seed_completed_at';
    `);

    const gatedResult = await runRollup(3);
    expectJob(gatedResult, {
      job: "rollup",
      status: "applied",
      items: 0,
    });
    expect(gatedResult.detail).toBe("legacy=0,v4=0");

    const gatedSnapshot = await queryOne<{ last_seen_uses: string }>(`
      SELECT s.last_seen_uses
      FROM nullifier_v4 n
      JOIN nullifier_v4_uses_seen s ON s.nullifier_v4_id = n.id
      WHERE n.nullifier = 111;
    `);
    expect(Number(gatedSnapshot.last_seen_uses)).toBe(1);

    await integrationDBExecuteQuery(`
      INSERT INTO verification_analytics_config (key, timestamp_value)
      VALUES ('v4_seed_completed_at', now());
    `);

    const beforePendingDelta = await getProdActionTotal();
    const ungatedResult = await runRollup(4);
    const afterPendingDelta = await getProdActionTotal();

    expectJob(ungatedResult, {
      job: "rollup",
      status: "applied",
      items: 1,
    });
    expect(ungatedResult.detail).toBe("legacy=0,v4=1");
    expectMeasureDelta(beforePendingDelta, afterPendingDelta, 1, 0, 1);
    expectMeasures(afterPendingDelta, 5, 3, 2);

    const processedSnapshot = await queryOne<{ last_seen_uses: string }>(`
      SELECT s.last_seen_uses
      FROM nullifier_v4 n
      JOIN nullifier_v4_uses_seen s ON s.nullifier_v4_id = n.id
      WHERE n.nullifier = 111;
    `);
    expect(Number(processedSnapshot.last_seen_uses)).toBe(2);
  });
});

describe("atomic v4 nullifier concurrency", () => {
  it("keeps one unique and one repeat across parallel real Hasura mutations", async () => {
    await createSeededFixture();
    const before = await getProdActionTotal();

    const responses = await Promise.all([
      runAtomicHasuraMutation(777),
      runAtomicHasuraMutation(777),
    ]);

    for (const response of responses) {
      expect(response.errors).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(response.data?.update_nullifier_v4.affected_rows).toBe(1);
    }
    expect(
      responses.filter(
        (response) => response.data?.insert_nullifier_v4_one !== null,
      ),
    ).toHaveLength(1);

    const finalNullifier = await queryOne<{ count: string; uses: string }>(`
      SELECT count(*) AS count, max(uses) AS uses
      FROM nullifier_v4
      WHERE nullifier = 777
        AND action_v4_id = 'action_v4_prod1';
    `);
    expect(Number(finalNullifier.count)).toBe(1);
    expect(Number(finalNullifier.uses)).toBe(2);

    const rollupResult = await runRollup(1);
    const after = await getProdActionTotal();

    expectJob(rollupResult, {
      job: "rollup",
      status: "applied",
      items: 1,
    });
    expect(rollupResult.detail).toBe("legacy=0,v4=1");
    expectMeasureDelta(before, after, 2, 1, 1);
    expectMeasures(after, 4, 3, 1);
  });
});

describe("reconcile_verification_stats v4 source", () => {
  it("flips sources, repairs the stranded delta, and resets the cursor", async () => {
    const fixture = await createReconciliationFixture();
    const beforeTotal = await getProdActionTotal();
    const beforeToday = await queryOne<MeasureRow>(`
      SELECT verifications, unique_verifications, repeated_verifications
      FROM action_verification_stats_daily
      WHERE action_id = 'action_v4_prod1'
        AND source = 'v4'
        AND environment = 'production'
        AND date = (now() AT TIME ZONE 'UTC')::date;
    `);
    expectMeasures(beforeTotal, 5, 4, 1);

    const legacyResult = await runReconciliation(500);
    expectJob(legacyResult, {
      job: "reconciliation",
      status: "continue",
      items: 0,
    });
    expect(legacyResult.detail).toContain("source=legacy");

    const v4Result = await runReconciliation(500);
    expectJob(v4Result, {
      job: "reconciliation",
      status: "continue",
      items: 2,
      repaired: 1,
      alerts: 0,
    });

    const appsLeg = await runReconciliation(500);
    expectJob(appsLeg, {
      job: "reconciliation",
      status: "done",
      repaired: 0,
      alerts: 0,
    });
    expect(v4Result.detail).toContain("source=v4");

    const actionTotal = await getProdActionTotal();
    expectMeasures(actionTotal, 7, 4, 3);

    const appTotal = await getProdAppTotal(fixture.appId);
    expectMeasures(appTotal, 7, 4, 3);

    const afterToday = await queryOne<MeasureRow>(`
      SELECT verifications, unique_verifications, repeated_verifications
      FROM action_verification_stats_daily
      WHERE action_id = 'action_v4_prod1'
        AND source = 'v4'
        AND environment = 'production'
        AND date = (now() AT TIME ZONE 'UTC')::date;
    `);
    expectMeasureDelta(beforeToday, afterToday, 2, 0, 2);

    const snapshot = await queryOne<{ last_seen_uses: string }>(`
      SELECT last_seen_uses
      FROM nullifier_v4_uses_seen
      WHERE nullifier_v4_id = 'nullifier_v4_555';
    `);
    expect(Number(snapshot.last_seen_uses)).toBe(3);

    const cursor = await queryOne<{
      last_source: string;
      last_action_id: string | null;
    }>(`
      SELECT last_source, last_action_id
      FROM verification_reconciliation_state
      WHERE id;
    `);
    expect(cursor.last_source).toBe("legacy");
    expect(cursor.last_action_id).toBeNull();
  });

  it("alerts on action and app structural drift without decrementing totals", async () => {
    const fixture = await createReconciliationFixture();
    await runReconciliation(500);
    await runReconciliation(500);
    await runReconciliation(500);

    await integrationDBExecuteQuery(`
      UPDATE action_verification_stats_total
      SET
        verifications = verifications + 10,
        repeated_verifications = repeated_verifications + 10
      WHERE action_id = 'action_v4_prod1'
        AND source = 'v4'
        AND environment = 'production';
    `);

    try {
      const legacyResult = await runReconciliation(500);
      expectJob(legacyResult, {
        job: "reconciliation",
        status: "continue",
        items: 0,
      });
      expect(legacyResult.detail).toContain("source=legacy");

      const v4Result = await runReconciliation(500);
      expectJob(v4Result, {
        job: "reconciliation",
        status: "continue",
        items: 2,
        repaired: 0,
        alerts: 1,
      });
      expect(v4Result.detail).toContain("source=v4");

      const corruptedActionTotal = await getProdActionTotal();
      expectMeasures(corruptedActionTotal, 17, 4, 13);

      // Apps leg: the app row follows the (corrupt) action sum; the action-level
      // mismatch keeps alerting every cycle until a human repairs it.
      const appsLeg = await runReconciliation(500);
      expectJob(appsLeg, {
        job: "reconciliation",
        status: "done",
        repaired: 1,
        alerts: 0,
      });
      const storedAppTotal = await getProdAppTotal(fixture.appId);
      expectMeasures(storedAppTotal, 17, 4, 13);
    } finally {
      await integrationDBExecuteQuery(`
        BEGIN;

        UPDATE action_verification_stats_total
        SET
          verifications = 7,
          unique_verifications = 4,
          repeated_verifications = 3
        WHERE action_id = 'action_v4_prod1'
          AND source = 'v4'
          AND environment = 'production';

        UPDATE app_verification_stats_total
        SET
          verifications = 7,
          unique_verifications = 4,
          repeated_verifications = 3
        WHERE app_id = (
            SELECT r.app_id
            FROM action_v4 a
            JOIN rp_registration r ON r.rp_id = a.rp_id
            WHERE a.id = 'action_v4_prod1'
          )
          AND source = 'v4'
          AND environment = 'production';

        COMMIT;
      `);
    }
  });
});

describe("v4 verification analytics deletion chains", () => {
  it("purges environment rows through action and RP cascades while preserving the app", async () => {
    const fixture = await createSeededFixture();

    await integrationDBExecuteQuery(
      "DELETE FROM action_v4 WHERE id = 'action_v4_stg1';",
    );

    const stagingCounts = await queryOne<{
      action_daily: string;
      action_total: string;
      app_daily: string;
      app_total: string;
    }>(
      `
        SELECT
          (
            SELECT count(*)
            FROM action_verification_stats_daily
            WHERE action_id = 'action_v4_stg1'
              AND source = 'v4'
          ) AS action_daily,
          (
            SELECT count(*)
            FROM action_verification_stats_total
            WHERE action_id = 'action_v4_stg1'
              AND source = 'v4'
          ) AS action_total,
          (
            SELECT count(*)
            FROM app_verification_stats_daily
            WHERE app_id = $1
              AND source = 'v4'
              AND environment = 'staging'
          ) AS app_daily,
          (
            SELECT count(*)
            FROM app_verification_stats_total
            WHERE app_id = $1
              AND source = 'v4'
              AND environment = 'staging'
          ) AS app_total;
      `,
      [fixture.appId],
    );
    expect(Number(stagingCounts.action_daily)).toBe(0);
    expect(Number(stagingCounts.action_total)).toBe(0);
    expect(Number(stagingCounts.app_daily)).toBe(0);
    expect(Number(stagingCounts.app_total)).toBe(0);

    await integrationDBExecuteQuery(
      "DELETE FROM rp_registration WHERE rp_id = $1;",
      [fixture.rpId],
    );

    const finalCounts = await queryOne<{
      app: string;
      rp: string;
      actions: string;
      nullifiers: string;
      snapshots: string;
      action_daily: string;
      action_total: string;
      app_daily: string;
      app_total: string;
    }>(
      `
        SELECT
          (SELECT count(*) FROM app WHERE id = $1) AS app,
          (SELECT count(*) FROM rp_registration WHERE rp_id = $2) AS rp,
          (SELECT count(*) FROM action_v4) AS actions,
          (SELECT count(*) FROM nullifier_v4) AS nullifiers,
          (SELECT count(*) FROM nullifier_v4_uses_seen) AS snapshots,
          (
            SELECT count(*)
            FROM action_verification_stats_daily
            WHERE source = 'v4'
              AND app_id = $1
          ) AS action_daily,
          (
            SELECT count(*)
            FROM action_verification_stats_total
            WHERE source = 'v4'
              AND app_id = $1
          ) AS action_total,
          (
            SELECT count(*)
            FROM app_verification_stats_daily
            WHERE source = 'v4'
              AND app_id = $1
          ) AS app_daily,
          (
            SELECT count(*)
            FROM app_verification_stats_total
            WHERE source = 'v4'
              AND app_id = $1
          ) AS app_total;
      `,
      [fixture.appId, fixture.rpId],
    );
    expect(Number(finalCounts.app)).toBe(1);
    expect(Number(finalCounts.rp)).toBe(0);
    expect(Number(finalCounts.actions)).toBe(0);
    expect(Number(finalCounts.nullifiers)).toBe(0);
    expect(Number(finalCounts.snapshots)).toBe(0);
    expect(Number(finalCounts.action_daily)).toBe(0);
    expect(Number(finalCounts.action_total)).toBe(0);
    expect(Number(finalCounts.app_daily)).toBe(0);
    expect(Number(finalCounts.app_total)).toBe(0);
  });
});
