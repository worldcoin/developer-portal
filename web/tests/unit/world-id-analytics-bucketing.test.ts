import {
  bucketAllTimeSeries,
  formatAnalyticsDate,
  formatAnalyticsDateRange,
  sumAnalyticsSeries,
} from "@/lib/world-id-analytics";

// #region Test Data
type AnalyticsPoint = {
  date: string;
  count: string;
};

type AnalyticsBucket = {
  start_date: string;
  end_date: string;
  count: string;
};

const point = (day: number, count = day): AnalyticsPoint => ({
  date: `2026-01-${day.toString().padStart(2, "0")}`,
  count: count.toString(),
});

const days = (length: number) =>
  Array.from({ length }, (_, index) => point(index + 1));

const bucketSize = (bucket: { start_date: string; end_date: string }) => {
  const start = Date.parse(`${bucket.start_date}T00:00:00.000Z`);
  const end = Date.parse(`${bucket.end_date}T00:00:00.000Z`);
  return Math.round((end - start) / 86_400_000) + 1;
};
// #endregion

// #region Selected-period totals
describe("World ID analytics series [selected-period total]", () => {
  it("sums integer-safe point strings without converting through Number", () => {
    expect(
      sumAnalyticsSeries([
        { date: "2026-01-01", count: "9007199254740993" },
        { date: "2026-01-02", count: "9" },
      ]),
    ).toBe("9007199254741002");
  });

  it("returns zero for an empty series", () => {
    expect(sumAnalyticsSeries([])).toBe("0");
  });
});
// #endregion

// #region All Time bucket boundaries
describe("World ID analytics series [All Time grouping]", () => {
  it.each([0, 1, 6, 7])(
    "keeps a natural %i-point series ungrouped",
    (length) => {
      const input = days(length);
      const buckets = bucketAllTimeSeries(input);

      expect(buckets).toHaveLength(length);
      expect(
        buckets.map((bucket: AnalyticsBucket) => ({
          start_date: bucket.start_date,
          end_date: bucket.end_date,
          count: bucket.count,
        })),
      ).toEqual(
        input.map((item) => ({
          start_date: item.date,
          end_date: item.date,
          count: item.count,
        })),
      );
    },
  );

  it("groups eight days into seven consecutive near-equal ranges", () => {
    const buckets = bucketAllTimeSeries(days(8));

    expect(buckets).toHaveLength(7);
    expect(buckets[0]).toEqual({
      start_date: "2026-01-01",
      end_date: "2026-01-02",
      count: "3",
    });
    expect(buckets.at(-1)).toEqual({
      start_date: "2026-01-08",
      end_date: "2026-01-08",
      count: "8",
    });
    expect(
      buckets.map((bucket: AnalyticsBucket) => bucketSize(bucket)),
    ).toEqual([2, 1, 1, 1, 1, 1, 1]);
  });

  it("uses at most seven near-equal buckets for a long daily history", () => {
    const input = days(28);
    const buckets = bucketAllTimeSeries(input);
    const sizes = buckets.map((bucket: AnalyticsBucket) => bucketSize(bucket));

    expect(buckets).toHaveLength(7);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    expect(buckets[0].start_date).toBe(input[0].date);
    expect(buckets.at(-1)?.end_date).toBe(input.at(-1)?.date);
  });

  it("preserves order, contiguity, and the exact total for a non-even history", () => {
    const input = days(23);
    const buckets = bucketAllTimeSeries(input);

    for (let index = 1; index < buckets.length; index += 1) {
      const previousEnd = new Date(
        `${buckets[index - 1].end_date}T00:00:00.000Z`,
      );
      previousEnd.setUTCDate(previousEnd.getUTCDate() + 1);
      expect(buckets[index].start_date).toBe(
        previousEnd.toISOString().slice(0, 10),
      );
    }
    expect(sumAnalyticsSeries(input)).toBe(
      buckets
        .reduce(
          (total: bigint, bucket: AnalyticsBucket) =>
            total + BigInt(bucket.count),
          0n,
        )
        .toString(),
    );
  });

  it("sums each range instead of averaging or accumulating across ranges", () => {
    const buckets = bucketAllTimeSeries(
      Array.from({ length: 14 }, (_, index) => point(index + 1, 2)),
    );

    expect(buckets.map((bucket: AnalyticsBucket) => bucket.count)).toEqual([
      "4",
      "4",
      "4",
      "4",
      "4",
      "4",
      "4",
    ]);
  });
});
// #endregion

// #region UTC labels
describe("World ID analytics series [UTC labels]", () => {
  it("formats a date-only value as the same UTC calendar date", () => {
    expect(formatAnalyticsDate("2026-01-01")).toBe("Jan 1, 2026");
  });

  it("formats grouped tooltips with both UTC range boundaries", () => {
    expect(formatAnalyticsDateRange("2025-12-31", "2026-01-02")).toBe(
      "Dec 31, 2025 – Jan 2, 2026",
    );
  });

  it("does not shift a date when the runtime timezone is west of UTC", () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";

    try {
      expect(formatAnalyticsDate("2026-07-30")).toBe("Jul 30, 2026");
    } finally {
      process.env.TZ = previousTimezone;
    }
  });
});
// #endregion
