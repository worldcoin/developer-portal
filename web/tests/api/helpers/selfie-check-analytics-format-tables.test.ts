import {
  parseDailyTable,
  parseTotalsTable,
  TableValidationError,
} from "@/api/helpers/selfie-check-analytics/format-tables";

// #region Test Data
const appIdA = "app_0123456789abcdef0123456789abcdef";
const appIdB = "app_staging_fedcba9876543210fedcba9876543210";

const totalsCsv = (
  proofSharedA: number | string = 3,
  proofSharedB: number | string = 7,
  completionB = "",
) =>
  [
    "PARTNER_APP_ID,N_USERS_STARTED_AT_LEAST_ONE_SELFIE_CHECK_FLOW,N_USERS_SHARED_AT_LEAST_ONE_PROOF,N_SELFIE_CHECK_STARTED_SESSIONS,N_FACE_CAPTURE_STARTED_SESSIONS,N_FACE_CAPTURE_COMPLETED_SESSIONS,N_PROOF_SHARED_SESSIONS,P_SELFIE_CHECK_TO_FACE_CAPTURE_STARTED_COMPLETION,P_FACE_CAPTURE_STARTED_TO_COMPLETED_COMPLETION,P_FACE_CAPTURE_COMPLETED_TO_PROOF_SHARED_COMPLETION",
    `${appIdA},10,8,10,9,8,${proofSharedA},0.9,"0.75",0.5`,
    `${appIdB},10,8,10,9,8,${proofSharedB},0.9,${completionB},0.5`,
  ].join("\n");

const dailyHeader =
  "PARTNER_APP_ID,DAY,OS_NAME,N_USERS_STARTED_SELFIE_CHECK_FLOW,N_USERS_SHARED_A_PROOF,CUMULATIVE_N_USERS_SHARED_A_PROOF,P_FACE_CAPTURE_COMPLETION";

const dailyCsv = (...rows: string[]) => [dailyHeader, ...rows].join("\n");

const dailyRow = ({
  appId = appIdA,
  day = "2026-08-26",
  osName = "iOS",
  proofs = 3,
  completion = "0.75",
}: {
  appId?: string;
  day?: string;
  osName?: string;
  proofs?: number | string;
  completion?: string;
} = {}) => `${appId},${day},${osName},10,${proofs},20,${completion}`;
// #endregion

// #region Totals table
describe("parseTotalsTable", () => {
  it("normalizes headers and indexes one typed row per app ID", () => {
    const result = parseTotalsTable(`\uFEFF${totalsCsv().toLowerCase()}\n`);

    expect(result.headers).toEqual([
      "PARTNER_APP_ID",
      "N_USERS_STARTED_AT_LEAST_ONE_SELFIE_CHECK_FLOW",
      "N_USERS_SHARED_AT_LEAST_ONE_PROOF",
      "N_SELFIE_CHECK_STARTED_SESSIONS",
      "N_FACE_CAPTURE_STARTED_SESSIONS",
      "N_FACE_CAPTURE_COMPLETED_SESSIONS",
      "N_PROOF_SHARED_SESSIONS",
      "P_SELFIE_CHECK_TO_FACE_CAPTURE_STARTED_COMPLETION",
      "P_FACE_CAPTURE_STARTED_TO_COMPLETED_COMPLETION",
      "P_FACE_CAPTURE_COMPLETED_TO_PROOF_SHARED_COMPLETION",
    ]);
    expect(result.records.get(appIdA)).toEqual({
      appId: appIdA,
      n_users_started_at_least_one_selfie_check_flow: 10,
      n_users_shared_at_least_one_proof: 8,
      n_selfie_check_started_sessions: 10,
      n_face_capture_started_sessions: 9,
      n_face_capture_completed_sessions: 8,
      n_proof_shared_sessions: 3,
      p_selfie_check_to_face_capture_started_completion: 0.9,
      p_face_capture_started_to_completed_completion: 0.75,
      p_face_capture_completed_to_proof_shared_completion: 0.5,
    });
  });

  it("represents an empty metric as null", () => {
    const result = parseTotalsTable(totalsCsv(3, ""));

    expect(result.records.get(appIdB)?.n_proof_shared_sessions).toBeNull();
  });

  it("represents both Snowflake null marker escapes as null", () => {
    for (const marker of ["\\N", "\\\\N"]) {
      const result = parseTotalsTable(totalsCsv(3, 7, marker));

      expect(
        result.records.get(appIdB)
          ?.p_face_capture_started_to_completed_completion,
      ).toBeNull();
    }
  });

  it("rejects non-numeric metric values", () => {
    expect(() => parseTotalsTable(totalsCsv("not-a-number"))).toThrow(
      "is not a non-negative number",
    );
  });

  it("rejects duplicate app IDs", () => {
    expect(() => parseTotalsTable(totalsCsv().replace(appIdB, appIdA))).toThrow(
      "duplicate app ID",
    );
  });

  it("rejects the previous totals schema", () => {
    const legacyCsv = [
      "PARTNER_APP_ID,N_USERS_STARTED_SELFIE_CHECK_FLOW,N_PROOFS,N_PROOF_USERS,N_FACE_AUTH_STARTED_SESSIONS,N_FACE_AUTH_COMPLETED_SESSIONS,P_FACE_AUTH_COMPLETION",
      `${appIdA},10,3,8,9,8,0.75`,
    ].join("\n");

    expect(() => parseTotalsTable(legacyCsv)).toThrow(
      "Totals table schema does not match the expected columns",
    );
  });
});
// #endregion

// #region Daily table
describe("parseDailyTable", () => {
  it("groups every row under its app ID while preserving source order", () => {
    const first = dailyRow({ day: "2026-08-25", osName: "iOS", proofs: 2 });
    const second = dailyRow({
      day: "2026-08-26",
      osName: "Android",
      proofs: 3,
    });
    const third = dailyRow({ appId: appIdB, proofs: 7 });

    const result = parseDailyTable(dailyCsv(first, second, third));

    expect(result.records.size).toBe(2);
    expect(result.records.get(appIdA)).toEqual([
      expect.objectContaining({
        appId: appIdA,
        day: "2026-08-25",
        os_name: "iOS",
        n_users_shared_a_proof: 2,
      }),
      expect.objectContaining({
        appId: appIdA,
        day: "2026-08-26",
        os_name: "Android",
        n_users_shared_a_proof: 3,
      }),
    ]);
    expect(result.records.get(appIdB)).toHaveLength(1);
    expect(
      [...result.records.values()].reduce(
        (rowCount, rows) => rowCount + rows.length,
        0,
      ),
    ).toBe(3);
  });

  it("allows the same app and day for different operating systems", () => {
    const result = parseDailyTable(
      dailyCsv(dailyRow({ osName: "iOS" }), dailyRow({ osName: "Android" })),
    );

    expect(result.records.get(appIdA)).toHaveLength(2);
  });

  it("rejects a duplicate app/day/OS key instead of losing a row", () => {
    expect(() =>
      parseDailyTable(dailyCsv(dailyRow(), dailyRow({ proofs: 9 }))),
    ).toThrow("duplicate app/day/OS row");
  });

  it("rejects an invalid calendar day", () => {
    expect(() =>
      parseDailyTable(dailyCsv(dailyRow({ day: "2026-02-30" }))),
    ).toThrow("invalid required daily column");
  });

  it("rejects the previous daily schema", () => {
    const legacyHeader =
      "PARTNER_APP_ID,DAY,OS_NAME,N_USERS_STARTED_SELFIE_CHECK_FLOW,N_PROOF_USERS,CUMULATIVE_N_PROOF_USERS,P_FACE_AUTH_COMPLETION";
    const legacyCsv = [
      legacyHeader,
      `${appIdA},2026-08-26,iOS,10,8,20,0.75`,
    ].join("\n");

    expect(() => parseDailyTable(legacyCsv)).toThrow(
      "Daily table schema does not match the expected columns",
    );
  });

  it("rejects an unexpected daily metric column", () => {
    expect(() =>
      parseDailyTable(`${dailyHeader},N_PROOF_USERS\n${dailyRow()},8`),
    ).toThrow("unexpected: N_PROOF_USERS");
  });
});
// #endregion

// #region Shared CSV validation
describe("analytics CSV validation", () => {
  it("rejects duplicate normalized headers", () => {
    expect(() =>
      parseTotalsTable(`PARTNER_APP_ID,n_proofs,N_PROOFS\n${appIdA},3,4\n`),
    ).toThrow("duplicate header");
  });

  it("rejects a missing app ID column", () => {
    expect(() => parseTotalsTable("N_PROOFS\n3\n")).toThrow(
      "must contain one of",
    );
  });

  it("uses warehouse app IDs as opaque map keys", () => {
    const warehouseAppId = "app_staging_c8137371ceac59890774ccc932e11dcf";
    const result = parseTotalsTable(
      totalsCsv().replace(appIdA, warehouseAppId),
    );

    expect(result.records.get(warehouseAppId)?.appId).toBe(warehouseAppId);
  });

  it("rejects a header-only export instead of an empty table", () => {
    expect(() => parseTotalsTable(`${totalsCsv().split("\n")[0]}\n`)).toThrow(
      "no data rows",
    );
  });

  it("wraps malformed CSV as a validation error", () => {
    expect(() =>
      parseTotalsTable(`PARTNER_APP_ID,N_PROOFS\n${appIdA},"unterminated\n`),
    ).toThrow(TableValidationError);
  });
});
// #endregion

// #region Row limit
it("rejects a table above the row limit without parsing it in full", () => {
  const rows = Array.from(
    { length: 250_001 },
    (_, index) => `app_${index.toString(16).padStart(32, "0")},1`,
  );
  const csv = ["PARTNER_APP_ID,N_PROOFS", ...rows].join("\n");

  expect(() => parseTotalsTable(csv)).toThrow("row maximum");
});
// #endregion
