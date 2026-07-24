import { integrationDBClean, integrationDBExecuteQuery } from "./setup";

jest.setTimeout(30_000);

const analyticsCleanupSql = `
  DELETE FROM nullifier_uses_seen;
  DELETE FROM nullifier_v4_uses_seen;
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

beforeEach(async () => {
  await integrationDBClean();
  await integrationDBExecuteQuery(analyticsCleanupSql);
});

describe("verification_analytics_meta", () => {
  it("exposes the watermark and config timestamps the endpoint needs", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO rollup_watermark (key, last_until, last_success_at)
      VALUES ('verification_stats', now() - interval '3 minutes', now() - interval '2 minutes');
      INSERT INTO verification_analytics_config (key, timestamp_value)
      VALUES ('legacy_daily_delta_started_at', now() - interval '10 days'),
             ('v4_seed_completed_at', now() - interval '5 days');
    `);

    const result = await integrationDBExecuteQuery(
      "SELECT key, timestamp_value FROM verification_analytics_meta() ORDER BY key;",
    );
    const keys = result.rows.map((row: { key: string }) => row.key);
    expect(keys).toEqual([
      "legacy_daily_delta_started_at",
      "v4_seed_completed_at",
      "watermark_last_success_at",
      "watermark_last_until",
    ]);
    for (const row of result.rows) {
      expect(row.timestamp_value).toBeInstanceOf(Date);
    }
  });

  it("returns only config rows when the watermark is absent", async () => {
    await integrationDBExecuteQuery(`
      INSERT INTO verification_analytics_config (key, timestamp_value)
      VALUES ('legacy_seed_completed_at', now());
    `);

    const result = await integrationDBExecuteQuery(
      "SELECT key FROM verification_analytics_meta();",
    );
    expect(result.rows.map((row: { key: string }) => row.key)).toEqual([
      "legacy_seed_completed_at",
    ]);
  });
});

describe("endpoint action paging SQL semantics", () => {
  it("orders by created_at desc with id tiebreak and searches before pagination", async () => {
    await integrationDBExecuteQuery(
      "INSERT INTO team (id, name) VALUES ('team_ep1', 'EP');",
    );
    const appRow = await integrationDBExecuteQuery(
      "INSERT INTO app (team_id, name, is_staging) VALUES ('team_ep1', 'EP App', false) RETURNING id;",
    );
    const appId = appRow.rows[0].id as string;
    await integrationDBExecuteQuery(
      "INSERT INTO rp_registration (rp_id, app_id, mode) VALUES ('rp_endpoint000001', $1, 'managed');",
      [appId],
    );
    // Same created_at for the pair proves the id tiebreak; a staging action and a
    // non-matching action prove filtering and search-before-pagination.
    await integrationDBExecuteQuery(`
      INSERT INTO action_v4 (id, rp_id, action, description, environment, created_at) VALUES
        ('action_v4_ep_a', 'rp_endpoint000001', 'pay-checkout', 'checkout flow', 'production', '2026-07-01T00:00:00Z'),
        ('action_v4_ep_b', 'rp_endpoint000001', 'pay-refund', 'refund flow', 'production', '2026-07-01T00:00:00Z'),
        ('action_v4_ep_c', 'rp_endpoint000001', 'login', 'sign in', 'production', '2026-07-02T00:00:00Z'),
        ('action_v4_ep_s', 'rp_endpoint000001', 'pay-staging', 'staging only', 'staging', '2026-07-03T00:00:00Z');
    `);

    const page = await integrationDBExecuteQuery(`
      SELECT id FROM action_v4
      WHERE rp_id = 'rp_endpoint000001' AND environment = 'production'
      ORDER BY created_at DESC, id DESC
      LIMIT 2 OFFSET 0;
    `);
    expect(page.rows.map((row: { id: string }) => row.id)).toEqual([
      "action_v4_ep_c",
      "action_v4_ep_b",
    ]);

    const searched = await integrationDBExecuteQuery(`
      SELECT id FROM action_v4
      WHERE rp_id = 'rp_endpoint000001' AND environment = 'production'
        AND (action ILIKE '%pay%' OR description ILIKE '%pay%')
      ORDER BY created_at DESC, id DESC
      LIMIT 1 OFFSET 0;
    `);
    const searchedCount = await integrationDBExecuteQuery(`
      SELECT count(*) FROM action_v4
      WHERE rp_id = 'rp_endpoint000001' AND environment = 'production'
        AND (action ILIKE '%pay%' OR description ILIKE '%pay%');
    `);
    expect(searched.rows[0].id).toBe("action_v4_ep_b");
    expect(Number(searchedCount.rows[0].count)).toBe(2);
  });
});
