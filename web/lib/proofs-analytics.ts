import {
  getTrendIntervalStart,
  type TrendInterval,
} from "./analytics-time-interval";

export type ProofsDailyRow = Readonly<{
  day: string;
  osName: string;
  proofType: string;
  nUsersSharedProof: number;
  cumulativeUniqueUsersSharedProof: number;
  nProofsShared: number;
}>;

export type ProofsDailyMetric =
  | "nUsersSharedProof"
  | "cumulativeUniqueUsersSharedProof"
  | "nProofsShared";

export type ProofsDimension = "proofType" | "osName";

export type ProofsTotals = Readonly<{
  nUsersSharedProof: number;
  nProofsShared: number;
}>;

// A full month makes each timeframe control visibly change the local preview.
const MOCK_DAYS = Array.from({ length: 30 }, (_, index) => {
  const day = new Date("2026-08-05T00:00:00.000Z");
  day.setUTCDate(day.getUTCDate() + index);
  return day.toISOString().slice(0, 10);
}).filter((day) => day !== "2026-09-01");

const MOCK_SEGMENTS = [
  {
    proofType: "Orb",
    osName: "iOS",
    users: 22,
    proofs: 31,
    cumulative: 188,
  },
  {
    proofType: "Selfie Check",
    osName: "Android",
    users: 14,
    proofs: 20,
    cumulative: 121,
  },
  {
    proofType: "Document",
    osName: "Android",
    users: 8,
    proofs: 11,
    cumulative: 75,
  },
] as const;

export const PROOF_TYPE_ORDER = ["Orb", "Document", "Selfie Check"] as const;

const PROOF_TYPE_COLORS: Record<(typeof PROOF_TYPE_ORDER)[number], string> = {
  "Selfie Check": "#E2A20A",
  Orb: "#25854A",
  Document: "#3859C7",
};

const OPERATING_SYSTEM_COLORS: Record<string, string> = {
  Android: "#A4C639",
  iOS: "#1C98F7",
};

export const getProofsSeriesColor = (
  dimension: ProofsDimension,
  value: string,
): string =>
  dimension === "proofType"
    ? PROOF_TYPE_COLORS[value as keyof typeof PROOF_TYPE_COLORS] ?? "#6B7280"
    : OPERATING_SYSTEM_COLORS[value] ?? "#6B7280";

/** Temporary local data for the Proofs analytics view while its API is built. */
export const proofsAnalyticsPreview: Readonly<{
  totals: ProofsTotals;
  daily: readonly ProofsDailyRow[];
}> = {
  totals: {
    nUsersSharedProof: 384,
    nProofsShared: 592,
  },
  daily: MOCK_DAYS.flatMap((day, dayIndex) =>
    MOCK_SEGMENTS.map((segment, segmentIndex) => ({
      day,
      osName: segment.osName,
      proofType: segment.proofType,
      nUsersSharedProof: segment.users + ((dayIndex * 3 + segmentIndex) % 7),
      cumulativeUniqueUsersSharedProof:
        segment.cumulative + dayIndex * (segment.users + 2),
      nProofsShared: segment.proofs + ((dayIndex * 4 + segmentIndex) % 9),
    })),
  ),
};

export const filterProofsDailyRows = (
  rows: readonly ProofsDailyRow[],
  filters: Readonly<{
    days: number | null;
    osName: string | null;
    proofType: string | null;
  }>,
): readonly ProofsDailyRow[] => {
  const latestDay = rows.reduce<string | null>(
    (latest, row) => (latest === null || row.day > latest ? row.day : latest),
    null,
  );
  let cutoffDay: string | null = null;
  if (filters.days !== null && latestDay !== null) {
    const cutoff = new Date(`${latestDay}T00:00:00.000Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - (filters.days - 1));
    cutoffDay = cutoff.toISOString().slice(0, 10);
  }

  return rows.filter(
    (row) =>
      (cutoffDay === null || row.day >= cutoffDay) &&
      (filters.osName === null || row.osName === filters.osName) &&
      (filters.proofType === null || row.proofType === filters.proofType),
  );
};

/** Combines the local Proofs mock records into daily, weekly, or monthly buckets. */
export const groupProofsDailyRowsByInterval = (
  rows: readonly ProofsDailyRow[],
  interval: TrendInterval,
): readonly ProofsDailyRow[] => {
  if (interval === "daily") return rows;

  const grouped = new Map<string, ProofsDailyRow>();
  for (const row of rows) {
    const day = getTrendIntervalStart(row.day, interval);
    const key = `${day}:${row.proofType}:${row.osName}`;
    const current = grouped.get(key);
    grouped.set(
      key,
      current
        ? {
            ...current,
            nUsersSharedProof:
              current.nUsersSharedProof + row.nUsersSharedProof,
            cumulativeUniqueUsersSharedProof: Math.max(
              current.cumulativeUniqueUsersSharedProof,
              row.cumulativeUniqueUsersSharedProof,
            ),
            nProofsShared: current.nProofsShared + row.nProofsShared,
          }
        : { ...row, day },
    );
  }

  return [...grouped.values()].sort(
    (a, b) =>
      a.day.localeCompare(b.day) ||
      a.proofType.localeCompare(b.proofType) ||
      a.osName.localeCompare(b.osName),
  );
};

export const buildProofsChartData = (
  rows: readonly ProofsDailyRow[],
  metric: ProofsDailyMetric,
  dimension: ProofsDimension,
  interval: TrendInterval = "daily",
  fillMissingDays = false,
) => {
  const pointsByDay = new Map<string, Record<string, number | string>>();
  const series = new Set<string>();

  for (const row of rows) {
    const point = pointsByDay.get(row.day) ?? { date: row.day };
    const seriesName = row[dimension];
    point[seriesName] =
      (typeof point[seriesName] === "number" ? point[seriesName] : 0) +
      row[metric];
    pointsByDay.set(row.day, point);
    if (row[metric] > 0) series.add(seriesName);
  }

  // Preserve missing source dates on the x-axis. Bars stay empty, while
  // cumulative series carry their previous value forward. The preview omits Sep 1.
  const reportedDays = [...pointsByDay.keys()].sort();
  const firstDay = reportedDays[0];
  const lastDay = reportedDays.at(-1);
  if (fillMissingDays && interval === "daily" && firstDay && lastDay) {
    const day = new Date(`${firstDay}T00:00:00.000Z`);
    const finalDay = new Date(`${lastDay}T00:00:00.000Z`);
    const previousValues = new Map<string, number>();
    while (day <= finalDay) {
      const date = day.toISOString().slice(0, 10);
      const point = pointsByDay.get(date);
      if (point) {
        for (const seriesName of series) {
          const value = point[seriesName];
          if (typeof value === "number") previousValues.set(seriesName, value);
        }
      } else {
        const missingPoint: Record<string, number | string> = { date };
        if (metric === "cumulativeUniqueUsersSharedProof") {
          for (const seriesName of series) {
            const previousValue = previousValues.get(seriesName);
            if (previousValue !== undefined) {
              missingPoint[seriesName] = previousValue;
            }
          }
        }
        pointsByDay.set(date, missingPoint);
      }
      day.setUTCDate(day.getUTCDate() + 1);
    }
  }

  return {
    points: [...pointsByDay.values()].sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    ),
    series: [...series].sort((a, b) => {
      if (dimension === "proofType") {
        return (
          PROOF_TYPE_ORDER.indexOf(a as (typeof PROOF_TYPE_ORDER)[number]) -
          PROOF_TYPE_ORDER.indexOf(b as (typeof PROOF_TYPE_ORDER)[number])
        );
      }
      return a.localeCompare(b);
    }),
  };
};
