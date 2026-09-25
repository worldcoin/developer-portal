/**
 * Approved endpoint contract ([HITL] approach sign-off 2026-07-30).
 *
 * Exact wire shape:
 * {
 *   "period": "last_7_days" | "all_time",
 *   "app": { "count": "<integer string>", "series": [{ "date": "YYYY-MM-DD", "count": "<integer string>" }] },
 *   "legacy_actions": [{ "id": ..., "count": ..., "series": [...] }],
 *   "actions": [{ "id": ..., "count": ..., "series": [...] }]
 * }
 * Counts are base-10 integer strings (bigint-safe); no other keys or aliases.
 */

export type ContractPoint = {
  count: string;
  date: string;
};

export type ContractMetric = {
  count: string;
  series: ContractPoint[];
};

export type ContractActionMetric = ContractMetric & {
  id: string;
};

export type ContractAnalytics = {
  actions: ContractActionMetric[];
  app: ContractMetric;
  legacyActions: ContractActionMetric[];
  period: "all_time" | "last_7_days";
};

const asRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("analytics response member must be an object");
  }
  return value as Record<string, unknown>;
};

const asCount = (value: unknown, label: string) => {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new Error(`${label} must be a base-10 integer string`);
  }
  return value;
};

const normalizePoint = (value: unknown): ContractPoint => {
  const point = asRecord(value);
  if (
    typeof point.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(point.date)
  ) {
    throw new Error("analytics point date must be an ISO date");
  }
  return {
    count: asCount(point.count, "point count"),
    date: point.date,
  };
};

const normalizeMetric = (value: unknown): ContractMetric => {
  const metric = asRecord(value);
  if (!Array.isArray(metric.series)) {
    throw new Error("analytics metric must contain a series");
  }
  return {
    count: asCount(metric.count, "metric count"),
    series: metric.series.map(normalizePoint),
  };
};

const normalizeActions = (value: unknown): ContractActionMetric[] => {
  if (!Array.isArray(value)) {
    throw new Error("analytics action metrics must be an array");
  }
  return value.map((item) => {
    const action = asRecord(item);
    if (typeof action.id !== "string") {
      throw new Error("analytics action metric must include an id");
    }
    return { id: action.id, ...normalizeMetric(action) };
  });
};

export const normalizeAnalyticsResponse = (
  value: unknown,
): ContractAnalytics => {
  const body = asRecord(value);
  const period = body.period;
  if (period !== "last_7_days" && period !== "all_time") {
    throw new Error("analytics response has an unknown period");
  }

  return {
    period,
    app: normalizeMetric(body.app),
    legacyActions: normalizeActions(body.legacy_actions),
    actions: normalizeActions(body.actions),
  };
};

/**
 * The approved wire shape used by mocked fetch responses. Do not import this
 * into production code.
 */
export const makeAnalyticsResponse = (
  input: Partial<ContractAnalytics> & Pick<ContractAnalytics, "app">,
) => ({
  period: input.period ?? "last_7_days",
  app: input.app,
  legacy_actions: input.legacyActions ?? [],
  actions: input.actions ?? [],
});
