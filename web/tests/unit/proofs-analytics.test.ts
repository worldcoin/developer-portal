import {
  buildProofsChartData,
  filterProofsDailyRows,
  proofsAnalyticsPreview,
} from "@/lib/proofs-analytics";

describe("Proofs analytics preview", () => {
  it("uses enough mock history for every timeframe option to change the chart window", () => {
    const visibleDays = (days: number) =>
      new Set(
        filterProofsDailyRows(proofsAnalyticsPreview.daily, {
          days,
          osName: null,
          proofType: null,
        }).map((row) => row.day),
      ).size;

    expect(visibleDays(7)).toBe(6);
    expect(visibleDays(14)).toBe(13);
    expect(visibleDays(30)).toBe(29);
  });

  it("keeps an empty daily point when the source has no data for that day", () => {
    const { points } = buildProofsChartData(
      proofsAnalyticsPreview.daily,
      "nUsersSharedProof",
      "proofType",
      "daily",
      true,
    );

    expect(points).toContainEqual({ date: "2026-09-01" });
    const cumulativePoints = buildProofsChartData(
      proofsAnalyticsPreview.daily,
      "cumulativeUniqueUsersSharedProof",
      "proofType",
      "daily",
      true,
    ).points;
    const previousPoint = cumulativePoints.find(
      (point) => point.date === "2026-08-31",
    );
    const missingPoint = cumulativePoints.find(
      (point) => point.date === "2026-09-01",
    );

    expect(missingPoint).toMatchObject({
      date: "2026-09-01",
      Orb: previousPoint?.Orb,
      Document: previousPoint?.Document,
      "Selfie Check": previousPoint?.["Selfie Check"],
    });
  });
});
