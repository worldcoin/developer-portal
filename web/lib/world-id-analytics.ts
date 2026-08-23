export type AnalyticsPoint = { date: string; count: string };
export type AnalyticsBucket = {
  start_date: string;
  end_date: string;
  count: string;
};

export const sumAnalyticsSeries = (series: AnalyticsPoint[]) =>
  series.reduce((sum, point) => sum + BigInt(point.count), 0n).toString();

export function bucketAllTimeSeries(
  series: AnalyticsPoint[],
): AnalyticsBucket[] {
  if (series.length <= 7) {
    return series.map((point) => ({
      start_date: point.date,
      end_date: point.date,
      count: point.count,
    }));
  }
  const base = Math.floor(series.length / 7);
  const remainder = series.length % 7;
  let offset = 0;
  return Array.from({ length: 7 }, (_, index) => {
    const size = base + (index < remainder ? 1 : 0);
    const slice = series.slice(offset, offset + size);
    offset += size;
    return {
      start_date: slice[0].date,
      end_date: slice.at(-1)!.date,
      count: slice
        .reduce((sum, point) => sum + BigInt(point.count), 0n)
        .toString(),
    };
  });
}

const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export const formatAnalyticsDate = (date: string) =>
  formatter.format(new Date(`${date}T00:00:00.000Z`));
export const formatAnalyticsDateRange = (start: string, end: string) =>
  `${formatAnalyticsDate(start)} – ${formatAnalyticsDate(end)}`;
