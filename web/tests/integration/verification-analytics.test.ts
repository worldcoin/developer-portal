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

type AppFixture = {
  prodAppId: string;
  stgAppId: string;
};

const canonicalTeamId = "team_0000000000000000000000000001";
const deletionTeamId = "team_0000000000000000000000000002";
const reconciliationTeamId = "team_0000000000000000000000000003";

const analyticsCleanupSql = `
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

const runSeed = async (): Promise<JobRow> => {
  const results = (await integrationDBExecuteQuery(`
    BEGIN;
    SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
    SELECT * FROM seed_legacy_verification_stats();
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

const runReconciliation = async (batchSize: number): Promise<JobRow> =>
  queryOne<JobRow>("SELECT * FROM reconcile_verification_stats($1);", [
    batchSize,
  ]);

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

const getTotalsSnapshot = async () => {
  const actionTotals = await integrationDBExecuteQuery(`
    SELECT
      action_id,
      app_id,
      source,
      environment,
      verifications,
      unique_verifications,
      repeated_verifications,
      latest_verification_at
    FROM action_verification_stats_total
    ORDER BY action_id, source, environment;
  `);
  const appTotals = await integrationDBExecuteQuery(`
    SELECT
      app_id,
      source,
      environment,
      verifications,
      unique_verifications,
      repeated_verifications,
      latest_verification_at
    FROM app_verification_stats_total
    ORDER BY app_id, source, environment;
  `);

  return {
    actionTotals: actionTotals.rows,
    appTotals: appTotals.rows,
  };
};

const createCanonicalFixture = async (): Promise<AppFixture> => {
  await integrationDBExecuteQuery(
    "INSERT INTO team (id, name) VALUES ($1, 'T');",
    [canonicalTeamId],
  );

  const prodAppId = await createApp(canonicalTeamId, "Analytics Prod", false);
  const stgAppId = await createApp(canonicalTeamId, "Analytics Staging", true);

  await integrationDBExecuteQuery(
    `
      INSERT INTO action (
        id,
        app_id,
        action,
        name,
        max_verifications,
        external_nullifier
      )
      VALUES
        ('action_prod1', $1, 'test-action', 'A1', 0, '0xext1'),
        ('action_stg1', $2, 'test-action', 'A2', 0, '0xext2');
    `,
    [prodAppId, stgAppId],
  );

  await integrationDBExecuteQuery(`
    INSERT INTO nullifier (
      id,
      action_id,
      nullifier_hash,
      uses,
      created_at,
      updated_at
    )
    VALUES
      (
        'nil_1',
        'action_prod1',
        '0xhash1',
        5,
        now() - interval '30 days',
        now() - interval '45 minutes'
      ),
      (
        'nil_2',
        'action_prod1',
        '0xhash2',
        3,
        now() - interval '20 days',
        now() - interval '5 minutes'
      ),
      (
        'nil_3',
        'action_prod1',
        '0xhash3',
        7,
        now() - interval '100 days',
        now() - interval '60 days'
      ),
      (
        'nil_4',
        'action_prod1',
        '0xhash4',
        0,
        now() - interval '10 days',
        now() - interval '10 days'
      ),
      (
        'nil_7',
        'action_stg1',
        '0xhash7',
        2,
        now() - interval '15 days',
        now() - interval '40 minutes'
      );

    INSERT INTO nullifier_uses_seen (
      nullifier_hash,
      last_seen_uses,
      last_seen_at
    )
    VALUES
      ('0xhash1', 2, now() - interval '2 days'),
      ('0xhash2', 2, now() - interval '2 days'),
      ('0xhash7', 1, now() - interval '2 days');
  `);

  return { prodAppId, stgAppId };
};

const addRollupActivity = async () => {
  await integrationDBExecuteQuery(`
    UPDATE nullifier
    SET uses = uses + 1
    WHERE id = 'nil_2';

    INSERT INTO nullifier (
      id,
      action_id,
      nullifier_hash,
      uses,
      created_at,
      updated_at
    )
    VALUES (
      'nil_5',
      'action_prod1',
      '0xhash5',
      1,
      now(),
      now()
    );
  `);
};

const createDeletionFixture = async (): Promise<AppFixture> => {
  await integrationDBExecuteQuery(
    "INSERT INTO team (id, name) VALUES ($1, 'Deletion T');",
    [deletionTeamId],
  );

  const prodAppId = await createApp(deletionTeamId, "Deletion Prod", false);
  const stgAppId = await createApp(deletionTeamId, "Deletion Staging", true);

  await integrationDBExecuteQuery(
    `
      INSERT INTO action (
        id,
        app_id,
        action,
        name,
        max_verifications,
        external_nullifier
      )
      VALUES
        ('action_dx', $1, 'delete-x', 'X', 0, '0xdelete-x'),
        ('action_dy', $1, 'delete-y', 'Y', 0, '0xdelete-y'),
        ('action_ds', $2, 'delete-s', 'S', 0, '0xdelete-s');
    `,
    [prodAppId, stgAppId],
  );

  await integrationDBExecuteQuery(`
    INSERT INTO nullifier (
      id,
      action_id,
      nullifier_hash,
      uses,
      created_at,
      updated_at
    )
    VALUES
      (
        'nil_dx1',
        'action_dx',
        '0xdx1',
        3,
        now() - interval '20 days',
        now() - interval '10 days'
      ),
      (
        'nil_dx2',
        'action_dx',
        '0xdx2',
        2,
        now() - interval '20 days',
        now() - interval '9 days'
      ),
      (
        'nil_dy',
        'action_dy',
        '0xdy',
        2,
        now() - interval '20 days',
        now() - interval '8 days'
      ),
      (
        'nil_ds',
        'action_ds',
        '0xds',
        1,
        now() - interval '20 days',
        now() - interval '7 days'
      );
  `);

  await runSeed();

  return { prodAppId, stgAppId };
};

const createReconciliationFixture = async (): Promise<{
  prodAppId: string;
}> => {
  await integrationDBExecuteQuery(
    "INSERT INTO team (id, name) VALUES ($1, 'Reconciliation T');",
    [reconciliationTeamId],
  );
  const prodAppId = await createApp(
    reconciliationTeamId,
    "Reconciliation Prod",
    false,
  );

  await integrationDBExecuteQuery(
    `
      INSERT INTO action (
        id,
        app_id,
        action,
        name,
        max_verifications,
        external_nullifier
      )
      VALUES (
        'action_r1',
        $1,
        'reconcile',
        'R1',
        0,
        '0xreconcile'
      );
    `,
    [prodAppId],
  );

  await integrationDBExecuteQuery(`
    INSERT INTO nullifier (
      id,
      action_id,
      nullifier_hash,
      uses,
      created_at,
      updated_at
    )
    VALUES
      (
        'n_a',
        'action_r1',
        '0xra',
        4,
        now() - interval '60 days',
        now() - interval '40 days'
      ),
      (
        'n_b',
        'action_r1',
        '0xrb',
        9,
        now() - interval '50 days',
        now() - interval '30 days'
      );

    INSERT INTO nullifier_uses_seen (
      nullifier_hash,
      last_seen_uses,
      last_seen_at
    )
    VALUES
      ('0xra', 4, now() - interval '40 days'),
      ('0xrb', 4, now() - interval '30 days');
  `);

  await integrationDBExecuteQuery(
    `
      INSERT INTO action_verification_stats_total (
        action_id,
        app_id,
        source,
        environment,
        verifications,
        unique_verifications,
        repeated_verifications
      )
      VALUES ('action_r1', $1, 'legacy', 'production', 8, 2, 6);
    `,
    [prodAppId],
  );
  await integrationDBExecuteQuery(
    `
      INSERT INTO app_verification_stats_total (
        app_id,
        source,
        environment,
        verifications,
        unique_verifications,
        repeated_verifications
      )
      VALUES ($1, 'legacy', 'production', 8, 2, 6);
    `,
    [prodAppId],
  );
  await integrationDBExecuteQuery(
    `
      INSERT INTO action_verification_stats_daily (
        action_id,
        app_id,
        source,
        environment,
        date,
        verifications,
        unique_verifications,
        repeated_verifications
      )
      SELECT
        'action_r1',
        $1,
        'legacy',
        'production',
        (created_at AT TIME ZONE 'UTC')::date,
        8,
        2,
        6
      FROM nullifier
      WHERE id = 'n_a';
    `,
    [prodAppId],
  );
  await integrationDBExecuteQuery(
    `
      INSERT INTO app_verification_stats_daily (
        app_id,
        source,
        environment,
        date,
        verifications,
        unique_verifications,
        repeated_verifications
      )
      SELECT
        $1,
        'legacy',
        'production',
        (created_at AT TIME ZONE 'UTC')::date,
        8,
        2,
        6
      FROM nullifier
      WHERE id = 'n_a';
    `,
    [prodAppId],
  );
  await integrationDBExecuteQuery(`
    INSERT INTO rollup_watermark (key, last_until, last_success_at)
    VALUES ('verification_stats', now(), now());
  `);

  return { prodAppId };
};

beforeEach(async () => {
  await integrationDBClean();
  await integrationDBExecuteQuery(analyticsCleanupSql);
});

describe("seed_legacy_verification_stats", () => {
  let fixture: AppFixture;
  let seedResult: JobRow;

  beforeEach(async () => {
    fixture = await createCanonicalFixture();
    seedResult = await runSeed();
  });

  it("returns applied with the finalized and repaired row counts", () => {
    expectJob(seedResult, {
      job: "seed",
      status: "applied",
      items: 4,
      repaired: 3,
    });
  });

  it("writes exact lifetime totals at action and app grain", async () => {
    const actionResult = await integrationDBExecuteQuery(`
      SELECT
        action_id,
        environment,
        verifications,
        unique_verifications,
        repeated_verifications
      FROM action_verification_stats_total
      WHERE source = 'legacy'
        AND action_id IN ('action_prod1', 'action_stg1')
      ORDER BY action_id;
    `);

    expectMeasures(
      actionResult.rows.find(
        (row: { action_id: string }) => row.action_id === "action_prod1",
      ),
      15,
      3,
      12,
    );
    expectMeasures(
      actionResult.rows.find(
        (row: { action_id: string }) => row.action_id === "action_stg1",
      ),
      2,
      1,
      1,
    );
    expect(
      actionResult.rows.find(
        (row: { action_id: string }) => row.action_id === "action_prod1",
      ).environment,
    ).toBe("production");
    expect(
      actionResult.rows.find(
        (row: { action_id: string }) => row.action_id === "action_stg1",
      ).environment,
    ).toBe("staging");

    const appResult = await integrationDBExecuteQuery(
      `
        SELECT
          app_id,
          environment,
          verifications,
          unique_verifications,
          repeated_verifications
        FROM app_verification_stats_total
        WHERE source = 'legacy'
          AND app_id IN ($1, $2)
        ORDER BY app_id;
      `,
      [fixture.prodAppId, fixture.stgAppId],
    );

    expectMeasures(
      appResult.rows.find(
        (row: { app_id: string }) => row.app_id === fixture.prodAppId,
      ),
      15,
      3,
      12,
    );
    expectMeasures(
      appResult.rows.find(
        (row: { app_id: string }) => row.app_id === fixture.stgAppId,
      ),
      2,
      1,
      1,
    );
  });

  it("writes honest first-use-only dailies and excludes zero-use rows", async () => {
    const result = await integrationDBExecuteQuery(`
      SELECT
        n.id,
        d.verifications,
        d.unique_verifications,
        d.repeated_verifications
      FROM nullifier n
      LEFT JOIN action_verification_stats_daily d
        ON d.action_id = n.action_id
       AND d.source = 'legacy'
       AND d.environment = 'production'
       AND d.date = (n.created_at AT TIME ZONE 'UTC')::date
      WHERE n.id IN ('nil_1', 'nil_2', 'nil_3', 'nil_4')
      ORDER BY n.id;
    `);

    for (const id of ["nil_1", "nil_2", "nil_3"]) {
      expectMeasures(
        result.rows.find((row: { id: string }) => row.id === id),
        1,
        1,
        0,
      );
    }

    const zeroUseRow = result.rows.find(
      (row: { id: string }) => row.id === "nil_4",
    );
    expect(zeroUseRow.verifications).toBeNull();
    expect(zeroUseRow.unique_verifications).toBeNull();
    expect(zeroUseRow.repeated_verifications).toBeNull();
  });

  it("places seed residue on the UTC updated-at day as repeats", async () => {
    const result = await integrationDBExecuteQuery(`
      SELECT
        action_id,
        verifications,
        unique_verifications,
        repeated_verifications
      FROM action_verification_stats_daily
      WHERE source = 'legacy'
        AND date = (now() AT TIME ZONE 'UTC')::date
        AND action_id IN ('action_prod1', 'action_stg1')
      ORDER BY action_id;
    `);

    expectMeasures(
      result.rows.find(
        (row: { action_id: string }) => row.action_id === "action_prod1",
      ),
      4,
      0,
      4,
    );
    expectMeasures(
      result.rows.find(
        (row: { action_id: string }) => row.action_id === "action_stg1",
      ),
      1,
      0,
      1,
    );
  });

  it("writes only legitimate residue to the old app_stats model", async () => {
    const todayResult = await integrationDBExecuteQuery(
      `
        SELECT app_id, verifications, unique_users
        FROM app_stats
        WHERE date = (now() AT TIME ZONE 'UTC')::date
          AND app_id IN ($1, $2)
        ORDER BY app_id;
      `,
      [fixture.prodAppId, fixture.stgAppId],
    );

    const prodToday = todayResult.rows.find(
      (row: { app_id: string }) => row.app_id === fixture.prodAppId,
    );
    const stgToday = todayResult.rows.find(
      (row: { app_id: string }) => row.app_id === fixture.stgAppId,
    );
    expect(Number(prodToday.verifications)).toBe(4);
    expect(Number(prodToday.unique_users)).toBe(2);
    expect(Number(stgToday.verifications)).toBe(1);
    expect(Number(stgToday.unique_users)).toBe(1);

    const dormantDays = await queryOne<{
      nil_3_rows: string;
      nil_4_rows: string;
    }>(
      `
        SELECT
          COUNT(*) FILTER (
            WHERE date = (
              SELECT (created_at AT TIME ZONE 'UTC')::date
              FROM nullifier
              WHERE id = 'nil_3'
            )
          ) AS nil_3_rows,
          COUNT(*) FILTER (
            WHERE date = (
              SELECT (created_at AT TIME ZONE 'UTC')::date
              FROM nullifier
              WHERE id = 'nil_4'
            )
          ) AS nil_4_rows
        FROM app_stats
        WHERE app_id = $1;
      `,
      [fixture.prodAppId],
    );
    expect(Number(dormantDays.nil_3_rows)).toBe(0);
    expect(Number(dormantDays.nil_4_rows)).toBe(0);
  });

  it("resets finalized snapshots to current uses and excludes zero-use rows", async () => {
    const result = await integrationDBExecuteQuery(`
      SELECT nullifier_hash, last_seen_uses
      FROM nullifier_uses_seen
      WHERE nullifier_hash IN (
        '0xhash1',
        '0xhash2',
        '0xhash3',
        '0xhash4',
        '0xhash7'
      )
      ORDER BY nullifier_hash;
    `);

    expect(
      result.rows.map(
        (row: { nullifier_hash: string; last_seen_uses: string }) => ({
          nullifier_hash: row.nullifier_hash,
          last_seen_uses: Number(row.last_seen_uses),
        }),
      ),
    ).toEqual([
      { nullifier_hash: "0xhash1", last_seen_uses: 5 },
      { nullifier_hash: "0xhash2", last_seen_uses: 3 },
      { nullifier_hash: "0xhash3", last_seen_uses: 7 },
      { nullifier_hash: "0xhash7", last_seen_uses: 2 },
    ]);
  });

  it("creates both seed markers and the verification_stats watermark", async () => {
    const config = await integrationDBExecuteQuery(`
      SELECT key
      FROM verification_analytics_config
      ORDER BY key;
    `);
    expect(config.rows.map((row: { key: string }) => row.key)).toEqual([
      "legacy_daily_delta_started_at",
      "legacy_seed_completed_at",
    ]);

    const watermark = await queryOne<{
      key: string;
      last_until: Date;
      last_success_at: Date;
    }>(`
      SELECT key, last_until, last_success_at
      FROM rollup_watermark
      WHERE key = 'verification_stats';
    `);
    expect(watermark.key).toBe("verification_stats");
    expect(watermark.last_until).toBeInstanceOf(Date);
    expect(watermark.last_success_at).toBeInstanceOf(Date);
  });

  it("skips a second seed call without changing totals", async () => {
    const before = await getTotalsSnapshot();
    const secondResult = await runSeed();
    const after = await getTotalsSnapshot();

    expectJob(secondResult, {
      job: "seed",
      status: "skipped_already_completed",
      items: 0,
    });
    expect(after).toEqual(before);
  });
});

describe("rollup_verification_stats", () => {
  let fixture: AppFixture;

  beforeEach(async () => {
    fixture = await createCanonicalFixture();
    await runSeed();
  });

  it("applies new unique and repeat activity to every read model", async () => {
    await addRollupActivity();
    const result = await runRollup(1);

    expectJob(result, {
      job: "rollup",
      status: "applied",
      items: 1,
    });

    const actionDaily = await queryOne<MeasureRow>(`
      SELECT verifications, unique_verifications, repeated_verifications
      FROM action_verification_stats_daily
      WHERE action_id = 'action_prod1'
        AND source = 'legacy'
        AND environment = 'production'
        AND date = (now() AT TIME ZONE 'UTC')::date;
    `);
    expectMeasures(actionDaily, 6, 1, 5);

    const actionTotal = await queryOne<MeasureRow>(`
      SELECT verifications, unique_verifications, repeated_verifications
      FROM action_verification_stats_total
      WHERE action_id = 'action_prod1'
        AND source = 'legacy'
        AND environment = 'production';
    `);
    expectMeasures(actionTotal, 17, 4, 13);

    const appStats = await queryOne<{
      verifications: string;
      unique_users: string;
    }>(
      `
        SELECT verifications, unique_users
        FROM app_stats
        WHERE app_id = $1
          AND date = (now() AT TIME ZONE 'UTC')::date;
      `,
      [fixture.prodAppId],
    );
    expect(Number(appStats.verifications)).toBe(6);
    expect(Number(appStats.unique_users)).toBe(3);

    const snapshots = await integrationDBExecuteQuery(`
      SELECT nullifier_hash, last_seen_uses
      FROM nullifier_uses_seen
      WHERE nullifier_hash IN ('0xhash2', '0xhash5')
      ORDER BY nullifier_hash;
    `);
    expect(
      snapshots.rows.map(
        (row: { nullifier_hash: string; last_seen_uses: string }) => ({
          nullifier_hash: row.nullifier_hash,
          last_seen_uses: Number(row.last_seen_uses),
        }),
      ),
    ).toEqual([
      { nullifier_hash: "0xhash2", last_seen_uses: 4 },
      { nullifier_hash: "0xhash5", last_seen_uses: 1 },
    ]);
  });

  it("is idempotent across an overlapping immediate second window", async () => {
    await addRollupActivity();
    await runRollup(1);
    const before = await getTotalsSnapshot();

    const secondResult = await runRollup(2);
    const after = await getTotalsSnapshot();

    expectJob(secondResult, {
      job: "rollup",
      status: "applied",
      items: 0,
    });
    expect(after).toEqual(before);
  });

  it("neutralizes the old wrapper and leaves activity for the new rollup", async () => {
    await addRollupActivity();
    await runRollup(1);
    await integrationDBExecuteQuery(`
      UPDATE nullifier
      SET uses = uses + 1
      WHERE id = 'nil_1';
    `);

    const beforeWrapper = await getTotalsSnapshot();
    const wrapperResult = await queryOne<{ count: string }>(`
      SELECT count(*)
      FROM rollup_app_stats(NULL, now() + interval '10 seconds');
    `);
    const snapshotAfterWrapper = await queryOne<{ last_seen_uses: string }>(`
      SELECT last_seen_uses
      FROM nullifier_uses_seen
      WHERE nullifier_hash = '0xhash1';
    `);
    const afterWrapper = await getTotalsSnapshot();

    expect(Number(wrapperResult.count)).toBe(0);
    expect(Number(snapshotAfterWrapper.last_seen_uses)).toBe(5);
    expect(afterWrapper).toEqual(beforeWrapper);

    const rollupResult = await runRollup(3);
    expectJob(rollupResult, {
      job: "rollup",
      status: "applied",
      items: 1,
    });

    const actionTotal = await queryOne<MeasureRow>(`
      SELECT verifications, unique_verifications, repeated_verifications
      FROM action_verification_stats_total
      WHERE action_id = 'action_prod1'
        AND source = 'legacy'
        AND environment = 'production';
    `);
    expectMeasures(actionTotal, 18, 4, 14);
  });

  it("advances the verification_stats watermark", async () => {
    const before = await queryOne<{ last_until: Date }>(`
      SELECT last_until
      FROM rollup_watermark
      WHERE key = 'verification_stats';
    `);

    await addRollupActivity();
    await runRollup(4);

    const after = await queryOne<{ last_until: Date }>(`
      SELECT last_until
      FROM rollup_watermark
      WHERE key = 'verification_stats';
    `);
    expect(after.last_until.getTime()).toBeGreaterThan(
      before.last_until.getTime(),
    );
  });
});

describe("seed rollback atomicity", () => {
  it("rolls back every seed side effect after a primary-key collision", async () => {
    const fixture = await createCanonicalFixture();
    await integrationDBExecuteQuery(
      `
        INSERT INTO action_verification_stats_total (
          action_id,
          app_id,
          source,
          environment,
          verifications,
          unique_verifications,
          repeated_verifications
        )
        VALUES (
          'action_prod1',
          $1,
          'legacy',
          'production',
          1,
          1,
          0
        );
      `,
      [fixture.prodAppId],
    );

    let seedError: unknown;
    try {
      await runSeed();
    } catch (error) {
      seedError = error;
    }

    expect(seedError).toBeDefined();
    expect((seedError as { code?: string }).code).toBe("23505");

    const state = await queryOne<{
      marker_count: string;
      watermark_count: string;
      action_daily_count: string;
      app_stats_count: string;
      hash1_last_seen_uses: string;
    }>(`
      SELECT
        (
          SELECT count(*)
          FROM verification_analytics_config
          WHERE key IN (
            'legacy_seed_completed_at',
            'legacy_daily_delta_started_at'
          )
        ) AS marker_count,
        (
          SELECT count(*)
          FROM rollup_watermark
          WHERE key = 'verification_stats'
        ) AS watermark_count,
        (
          SELECT count(*)
          FROM action_verification_stats_daily
        ) AS action_daily_count,
        (
          SELECT count(*)
          FROM app_stats
        ) AS app_stats_count,
        (
          SELECT last_seen_uses
          FROM nullifier_uses_seen
          WHERE nullifier_hash = '0xhash1'
        ) AS hash1_last_seen_uses;
    `);

    expect(Number(state.marker_count)).toBe(0);
    expect(Number(state.watermark_count)).toBe(0);
    expect(Number(state.action_daily_count)).toBe(0);
    expect(Number(state.app_stats_count)).toBe(0);
    expect(Number(state.hash1_last_seen_uses)).toBe(2);
  });
});

describe("action deletion verification analytics triggers", () => {
  let fixture: AppFixture;

  beforeEach(async () => {
    fixture = await createDeletionFixture();
  });

  it("subtracts a deleted action from app totals and preserves sibling rows", async () => {
    await integrationDBExecuteQuery(
      "DELETE FROM action WHERE id = 'action_dy';",
    );

    const appTotal = await queryOne<MeasureRow>(
      `
        SELECT verifications, unique_verifications, repeated_verifications
        FROM app_verification_stats_total
        WHERE app_id = $1
          AND source = 'legacy'
          AND environment = 'production';
      `,
      [fixture.prodAppId],
    );
    expectMeasures(appTotal, 5, 2, 3);

    const latests = await queryOne<{
      app_latest: Date | null;
      x_latest: Date | null;
    }>(
      `
        SELECT
          (
            SELECT latest_verification_at
            FROM app_verification_stats_total
            WHERE app_id = $1
              AND source = 'legacy'
              AND environment = 'production'
          ) AS app_latest,
          (
            SELECT latest_verification_at
            FROM action_verification_stats_total
            WHERE action_id = 'action_dx'
              AND source = 'legacy'
              AND environment = 'production'
          ) AS x_latest;
      `,
      [fixture.prodAppId],
    );
    expect(latests.app_latest).not.toBeNull();
    expect(latests.app_latest?.getTime()).toBe(latests.x_latest?.getTime());

    const rowCounts = await queryOne<{
      y_daily: string;
      y_total: string;
      x_daily: string;
      x_total: string;
    }>(`
      SELECT
        (
          SELECT count(*)
          FROM action_verification_stats_daily
          WHERE action_id = 'action_dy'
        ) AS y_daily,
        (
          SELECT count(*)
          FROM action_verification_stats_total
          WHERE action_id = 'action_dy'
        ) AS y_total,
        (
          SELECT count(*)
          FROM action_verification_stats_daily
          WHERE action_id = 'action_dx'
        ) AS x_daily,
        (
          SELECT count(*)
          FROM action_verification_stats_total
          WHERE action_id = 'action_dx'
        ) AS x_total;
    `);
    expect(Number(rowCounts.y_daily)).toBe(0);
    expect(Number(rowCounts.y_total)).toBe(0);
    expect(Number(rowCounts.x_daily)).toBeGreaterThan(0);
    expect(Number(rowCounts.x_total)).toBe(1);
  });

  it("removes zero-valued staging app daily and total rows", async () => {
    await integrationDBExecuteQuery(
      "DELETE FROM action WHERE id = 'action_ds';",
    );

    const rowCounts = await queryOne<{
      daily_count: string;
      total_count: string;
    }>(
      `
        SELECT
          (
            SELECT count(*)
            FROM app_verification_stats_daily
            WHERE app_id = $1
              AND environment = 'staging'
          ) AS daily_count,
          (
            SELECT count(*)
            FROM app_verification_stats_total
            WHERE app_id = $1
              AND environment = 'staging'
          ) AS total_count;
      `,
      [fixture.stgAppId],
    );
    expect(Number(rowCounts.daily_count)).toBe(0);
    expect(Number(rowCounts.total_count)).toBe(0);
  });

  it("rejects a subtraction that would make app totals negative", async () => {
    await integrationDBExecuteQuery(
      `
        UPDATE app_verification_stats_total
        SET
          verifications = 1,
          unique_verifications = 1,
          repeated_verifications = 0
        WHERE app_id = $1
          AND source = 'legacy'
          AND environment = 'production';
      `,
      [fixture.prodAppId],
    );

    try {
      await expect(
        integrationDBExecuteQuery("DELETE FROM action WHERE id = 'action_dx';"),
      ).rejects.toMatchObject({ code: "23514" });

      const actionCount = await queryOne<{ count: string }>(`
        SELECT count(*)
        FROM action
        WHERE id = 'action_dx';
      `);
      expect(Number(actionCount.count)).toBe(1);
    } finally {
      await integrationDBExecuteQuery(
        `
          UPDATE app_verification_stats_total
          SET
            verifications = 7,
            unique_verifications = 3,
            repeated_verifications = 4
          WHERE app_id = $1
            AND source = 'legacy'
            AND environment = 'production';
        `,
        [fixture.prodAppId],
      );
    }
  });

  it("cascades a whole-app delete cleanly after totals are restored", async () => {
    await integrationDBExecuteQuery(
      "DELETE FROM action WHERE id = 'action_ds';",
    );
    await integrationDBExecuteQuery(
      `
        UPDATE app_verification_stats_total
        SET
          verifications = 1,
          unique_verifications = 1,
          repeated_verifications = 0
        WHERE app_id = $1
          AND source = 'legacy'
          AND environment = 'production';
      `,
      [fixture.prodAppId],
    );
    await integrationDBExecuteQuery(
      `
        UPDATE app_verification_stats_total
        SET
          verifications = 7,
          unique_verifications = 3,
          repeated_verifications = 4
        WHERE app_id = $1
          AND source = 'legacy'
          AND environment = 'production';
      `,
      [fixture.prodAppId],
    );

    await integrationDBExecuteQuery("DELETE FROM app WHERE id = $1;", [
      fixture.prodAppId,
    ]);

    const counts = await queryOne<{
      action_daily: string;
      action_total: string;
      app_daily: string;
      app_total: string;
      prod_nullifiers: string;
    }>(`
      SELECT
        (SELECT count(*) FROM action_verification_stats_daily) AS action_daily,
        (SELECT count(*) FROM action_verification_stats_total) AS action_total,
        (SELECT count(*) FROM app_verification_stats_daily) AS app_daily,
        (SELECT count(*) FROM app_verification_stats_total) AS app_total,
        (
          SELECT count(*)
          FROM nullifier
          WHERE action_id IN ('action_dx', 'action_dy')
        ) AS prod_nullifiers;
    `);
    expect(Number(counts.action_daily)).toBe(0);
    expect(Number(counts.action_total)).toBe(0);
    expect(Number(counts.app_daily)).toBe(0);
    expect(Number(counts.app_total)).toBe(0);
    expect(Number(counts.prod_nullifiers)).toBe(0);
  });
});

describe("reconcile_verification_stats", () => {
  let prodAppId: string;

  beforeEach(async () => {
    ({ prodAppId } = await createReconciliationFixture());
  });

  it("repairs stranded deltas and resets the reconciliation cursor", async () => {
    const result = await runReconciliation(500);

    expectJob(result, {
      job: "reconciliation",
      status: "done",
      repaired: 1,
      alerts: 0,
    });

    const actionTotal = await queryOne<MeasureRow>(`
      SELECT verifications, unique_verifications, repeated_verifications
      FROM action_verification_stats_total
      WHERE action_id = 'action_r1'
        AND source = 'legacy'
        AND environment = 'production';
    `);
    expectMeasures(actionTotal, 13, 2, 11);

    const appTotal = await queryOne<MeasureRow>(
      `
        SELECT verifications, unique_verifications, repeated_verifications
        FROM app_verification_stats_total
        WHERE app_id = $1
          AND source = 'legacy'
          AND environment = 'production';
      `,
      [prodAppId],
    );
    expectMeasures(appTotal, 13, 2, 11);

    const todayDaily = await queryOne<MeasureRow>(`
      SELECT verifications, unique_verifications, repeated_verifications
      FROM action_verification_stats_daily
      WHERE action_id = 'action_r1'
        AND source = 'legacy'
        AND environment = 'production'
        AND date = (now() AT TIME ZONE 'UTC')::date;
    `);
    expectMeasures(todayDaily, 5, 0, 5);

    const snapshot = await queryOne<{ last_seen_uses: string }>(`
      SELECT last_seen_uses
      FROM nullifier_uses_seen
      WHERE nullifier_hash = '0xrb';
    `);
    expect(Number(snapshot.last_seen_uses)).toBe(9);

    const cursor = await queryOne<{
      last_action_id: string | null;
      last_run_at: Date | null;
    }>(`
      SELECT last_action_id, last_run_at
      FROM verification_reconciliation_state
      WHERE id;
    `);
    expect(cursor.last_action_id).toBeNull();
    expect(cursor.last_run_at).toBeInstanceOf(Date);
  });

  it("alerts on structural drift without decrementing stored totals", async () => {
    await integrationDBExecuteQuery(`
      UPDATE action_verification_stats_total
      SET
        verifications = verifications + 10,
        repeated_verifications = repeated_verifications + 10
      WHERE action_id = 'action_r1'
        AND source = 'legacy'
        AND environment = 'production';
    `);

    const result = await runReconciliation(500);
    expectJob(result, {
      job: "reconciliation",
      status: "done",
      repaired: 1,
      alerts: 2,
    });

    const corruptedTotal = await queryOne<MeasureRow>(`
      SELECT verifications, unique_verifications, repeated_verifications
      FROM action_verification_stats_total
      WHERE action_id = 'action_r1'
        AND source = 'legacy'
        AND environment = 'production';
    `);
    expectMeasures(corruptedTotal, 23, 2, 21);

    await integrationDBExecuteQuery(`
      UPDATE action_verification_stats_total
      SET
        verifications = 13,
        unique_verifications = 2,
        repeated_verifications = 11
      WHERE action_id = 'action_r1'
        AND source = 'legacy'
        AND environment = 'production';
    `);
    await integrationDBExecuteQuery(
      `
        UPDATE app_verification_stats_total
        SET
          verifications = 13,
          unique_verifications = 2,
          repeated_verifications = 11
        WHERE app_id = $1
          AND source = 'legacy'
          AND environment = 'production';
      `,
      [prodAppId],
    );
  });

  it("walks all actions through a bounded cursor and returns to null", async () => {
    const actionCountRow = await queryOne<{ count: string }>(
      "SELECT count(*) FROM action;",
    );
    const actionCount = Number(actionCountRow.count);

    let result = await runReconciliation(1);
    expectJob(result, {
      job: "reconciliation",
      status: "continue",
      items: 1,
    });

    const firstCursor = await queryOne<{ last_action_id: string | null }>(`
      SELECT last_action_id
      FROM verification_reconciliation_state
      WHERE id;
    `);
    expect(firstCursor.last_action_id).not.toBeNull();

    let totalItems = Number(result.items);
    let iterations = 0;
    const maxIterations = actionCount + 2;

    while (result.status !== "done" && iterations < maxIterations) {
      result = await runReconciliation(1);
      totalItems += Number(result.items);
      iterations += 1;
    }

    expect(iterations).toBeLessThan(maxIterations);
    expect(result.status).toBe("done");
    expect(totalItems).toBe(actionCount);

    const finalCursor = await queryOne<{ last_action_id: string | null }>(`
      SELECT last_action_id
      FROM verification_reconciliation_state
      WHERE id;
    `);
    expect(finalCursor.last_action_id).toBeNull();
  });

  it("skips reconciliation when the rollup watermark is absent", async () => {
    await integrationDBExecuteQuery("DELETE FROM rollup_watermark;");

    const result = await runReconciliation(500);
    expectJob(result, {
      job: "reconciliation",
      status: "skipped_no_watermark",
      items: 0,
      repaired: 0,
      alerts: 0,
    });
  });
});
