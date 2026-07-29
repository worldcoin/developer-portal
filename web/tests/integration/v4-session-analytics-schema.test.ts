import { integrationDBClean, integrationDBExecuteQuery } from "./setup";

beforeAll(integrationDBClean);

// #region Performance-critical schema
describe("v4 session analytics schema", () => {
  it("indexes event retention and daily rebuild dates", async () => {
    const result = await integrationDBExecuteQuery(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN (
          'session_verification_v4_created_at_idx',
          'session_v4_stats_daily_date_idx'
        )
      ORDER BY indexname;
    `);

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      indexname: "session_v4_stats_daily_date_idx",
    });
    expect(result.rows[0].indexdef).toMatch(
      /ON public\.session_v4_stats_daily .*\(date_utc\)$/,
    );
    expect(result.rows[1]).toMatchObject({
      indexname: "session_verification_v4_created_at_idx",
    });
    expect(result.rows[1].indexdef).toMatch(
      /ON public\.session_verification_v4 .*\(created_at\)$/,
    );
  });

  it("exposes both no-argument functions as volatile state-row sets", async () => {
    const result = await integrationDBExecuteQuery(`
      SELECT
        procedure.proname,
        procedure.provolatile,
        procedure.proretset,
        pg_get_function_arguments(procedure.oid) AS arguments,
        pg_get_function_result(procedure.oid) AS result
      FROM pg_proc procedure
      JOIN pg_namespace namespace
        ON namespace.oid = procedure.pronamespace
      WHERE namespace.nspname = 'public'
        AND procedure.proname IN (
          'prune_session_verifications',
          'rollup_v4_analytics'
        )
        AND procedure.pronargs = 0
      ORDER BY procedure.proname;
    `);

    expect(result.rows.map((row) => row.proname)).toEqual([
      "prune_session_verifications",
      "rollup_v4_analytics",
    ]);
    for (const row of result.rows) {
      expect(row).toMatchObject({
        provolatile: "v",
        proretset: true,
        arguments: "",
      });
      expect(row.result).toMatch(/^SETOF (?:public\.)?v4_analytics_state$/);
    }
  });
});
// #endregion
