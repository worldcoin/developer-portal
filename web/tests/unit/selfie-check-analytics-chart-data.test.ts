import {
  buildDailyChartData,
  type DailyRow,
} from "@/lib/selfie-check-analytics";

const appId = "app_0123456789abcdef0123456789abcdef";

const row = (overrides: Partial<DailyRow>): DailyRow => ({
  appId,
  day: "2026-08-26",
  os_name: "iOS",
  n_users_started_selfie_check_flow: 10,
  n_proofs: 3,
  n_proof_users: 8,
  cumulative_n_proofs: 30,
  cumulative_n_proof_users: 20,
  n_face_auth_started_sessions: 10,
  n_face_auth_completed_sessions: 8,
  p_face_auth_completion: 0.75,
  ...overrides,
});

describe("buildDailyChartData", () => {
  it("pivots day+OS rows into one ascending point per day", () => {
    const result = buildDailyChartData(
      [
        row({ day: "2026-08-26", os_name: "Android", n_proofs: 5 }),
        row({ day: "2026-08-25", os_name: "iOS", n_proofs: 2 }),
        row({ day: "2026-08-26", os_name: "iOS", n_proofs: 3 }),
      ],
      "n_proofs",
    );

    expect(result.series).toEqual(["Android", "iOS"]);
    expect(result.points).toEqual([
      { date: "2026-08-25", iOS: 2 },
      { date: "2026-08-26", Android: 5, iOS: 3 },
    ]);
  });

  it("keeps null metrics and omits absent OS keys instead of inventing zeros", () => {
    const result = buildDailyChartData(
      [
        row({ day: "2026-08-25", os_name: "iOS", n_proofs: null }),
        row({ day: "2026-08-26", os_name: "Android", n_proofs: 4 }),
      ],
      "n_proofs",
    );

    expect(result.points[0]).toEqual({ date: "2026-08-25", iOS: null });
    expect(result.points[1]).not.toHaveProperty("iOS");
  });

  it("remaps an OS named 'date' so it cannot clobber the x-axis key", () => {
    const result = buildDailyChartData(
      [row({ os_name: "date", n_proofs: 7 })],
      "n_proofs",
    );

    expect(result.series).toEqual(["date (os)"]);
    expect(result.points[0]).toEqual({ date: "2026-08-26", "date (os)": 7 });
  });
});
