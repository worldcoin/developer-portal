import {
  buildDailyChartData,
  filterDailyRows,
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

describe("filterDailyRows", () => {
  const rows = [
    row({ day: "2026-08-01", os_name: "iOS" }),
    row({ day: "2026-08-17", os_name: "Android" }),
    row({ day: "2026-08-30", os_name: "iOS" }),
  ];

  it("uses the newest data day as the inclusive timeframe boundary", () => {
    expect(filterDailyRows(rows, { days: 14, osName: null })).toEqual([
      rows[1],
      rows[2],
    ]);
  });

  it("filters by OS independently of the timeframe", () => {
    expect(filterDailyRows(rows, { days: null, osName: "iOS" })).toEqual([
      rows[0],
      rows[2],
    ]);
  });
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

    expect(result.operatingSystems.map(({ osName }) => osName)).toEqual([
      "Android",
      "iOS",
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

  it("uses the fixed OS order regardless of row order without reordering the input", () => {
    const rows = [
      row({ os_name: "Unknown", n_users_shared_a_proof: 1 }),
      row({ os_name: "iOS", n_users_shared_a_proof: 9 }),
      row({ os_name: "Android", n_users_shared_a_proof: 7 }),
    ];
    const result = buildDailyChartData(rows, "n_users_shared_a_proof");

    expect(result.operatingSystems.map(({ osName }) => osName)).toEqual([
      "Android",
      "iOS",
      "Unknown",
    ]);
    expect(rows.map(({ os_name }) => os_name)).toEqual([
      "Unknown",
      "iOS",
      "Android",
    ]);
    expect(result.points[0]).toEqual({
      date: "2026-08-26",
      "os:Android": 7,
      "os:iOS": 9,
      "os:Unknown": 1,
    });
  });

  it("does not invent OS series when there are no rows", () => {
    expect(buildDailyChartData([], "n_users_shared_a_proof")).toEqual({
      points: [],
      operatingSystems: [],
    });
  });
});
