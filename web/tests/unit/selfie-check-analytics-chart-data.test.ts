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
  n_users_shared_a_proof: 8,
  cumulative_n_users_shared_a_proof: 20,
  p_face_capture_completion: 0.75,
  ...overrides,
});

describe("buildDailyChartData", () => {
  it("pivots day+OS rows into one ascending point per day", () => {
    const result = buildDailyChartData(
      [
        row({
          day: "2026-08-26",
          os_name: "Android",
          n_users_shared_a_proof: 5,
        }),
        row({
          day: "2026-08-25",
          os_name: "iOS",
          n_users_shared_a_proof: 2,
        }),
        row({
          day: "2026-08-26",
          os_name: "iOS",
          n_users_shared_a_proof: 3,
        }),
      ],
      "n_users_shared_a_proof",
    );

    expect(result.operatingSystems).toEqual([
      { dataKey: "os:Android", osName: "Android" },
      { dataKey: "os:iOS", osName: "iOS" },
    ]);
    expect(result.points).toEqual([
      { date: "2026-08-25", "os:iOS": 2 },
      { date: "2026-08-26", "os:Android": 5, "os:iOS": 3 },
    ]);
  });

  it("keeps null metrics and omits absent OS keys instead of inventing zeros", () => {
    const result = buildDailyChartData(
      [
        row({
          day: "2026-08-25",
          os_name: "iOS",
          n_users_shared_a_proof: null,
        }),
        row({
          day: "2026-08-26",
          os_name: "Android",
          n_users_shared_a_proof: 4,
        }),
      ],
      "n_users_shared_a_proof",
    );

    expect(result.points[0]).toEqual({ date: "2026-08-25", "os:iOS": null });
    expect(result.points[1]).not.toHaveProperty("os:iOS");
  });

  it("keeps colliding display labels as distinct series keys", () => {
    const result = buildDailyChartData(
      [
        row({ os_name: "date", n_users_shared_a_proof: 7 }),
        row({ os_name: "date (os)", n_users_shared_a_proof: 9 }),
      ],
      "n_users_shared_a_proof",
    );

    expect(result.operatingSystems).toEqual([
      { dataKey: "os:date", osName: "date" },
      { dataKey: "os:date (os)", osName: "date (os)" },
    ]);
    expect(result.points[0]).toEqual({
      date: "2026-08-26",
      "os:date": 7,
      "os:date (os)": 9,
    });
  });
});
