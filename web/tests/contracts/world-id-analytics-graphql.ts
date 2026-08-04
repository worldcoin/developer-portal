/**
 * Approved generated-GraphQL wire shapes ([HITL] approach sign-off
 * 2026-07-30) for the operations in
 * api/portal/apps/[app_id]/world-id-analytics/graphql/get-world-id-analytics.graphql
 * and api/_rollup-world-id-analytics/graphql/rollup-world-id-analytics.graphql.
 *
 * Scope query result: { app: [{ id, created_at, is_staging,
 * rp_registration: [{ rp_id, created_at }] }], legacy_actions: [{ id, app_id,
 * created_at }], actions: [{ id, rp_id, environment, created_at }],
 * has_legacy_history: [{ date_utc }] }.
 */

export type AnalyticsScopeInput = {
  actions?: ReadonlyArray<Record<string, unknown>>;
  app?: Record<string, unknown> | null;
  hasLegacyHistory?: boolean;
  legacyActions?: ReadonlyArray<Record<string, unknown>>;
};

export const scopeRpId = "rp_0000000000000001";
export const otherScopeRpId = "rp_0000000000000002";

export const makeAnalyticsScopeResult = (
  appId: string,
  input: AnalyticsScopeInput = {},
) => ({
  app:
    input.app === null
      ? []
      : [
          {
            id: appId,
            created_at: "2026-07-20T14:00:00.000Z",
            is_staging: false,
            rp_registration: [
              { rp_id: scopeRpId, created_at: "2026-07-25T14:00:00.000Z" },
            ],
            ...input.app,
          },
        ],
  legacy_actions: (input.legacyActions ?? []).map((action) => ({ ...action })),
  // Unit tests describe v4 rows by app ownership; the wire carries rp_id, so
  // same-app rows get the app's RP id and foreign rows a different one.
  actions: (input.actions ?? []).map(({ app_id, ...action }) => ({
    rp_id:
      app_id === undefined || app_id === appId ? scopeRpId : otherScopeRpId,
    ...action,
  })),
  has_legacy_history:
    input.hasLegacyHistory ?? true ? [{ date_utc: "2026-01-05" }] : [],
});

export const makeAppDailyResult = (
  rows: Array<{ date_utc: string; unique_count: string }> = [],
) => ({
  world_id_app_stats_daily: rows,
});

export const makeActionDailyResult = (input?: {
  legacy?: Array<{
    action_id: string;
    date_utc: string;
    unique_count: string;
  }>;
  v4?: Array<{
    action_v4_id: string;
    date_utc: string;
    unique_count: string;
  }>;
}) => ({
  action_legacy_stats_daily: input?.legacy ?? [],
  action_v4_stats_daily: input?.v4 ?? [],
});

export const makeRollupOperationResult = (acquired: boolean) => ({
  rollup_world_id_analytics: acquired
    ? [{ processed_through: "2026-07-30T11:55:00.000Z" }]
    : [],
});
