import type { DailyRow, TotalsRow } from "@/lib/selfie-check-analytics";

const DAILY_COUNTS = [
  ["2026-08-18", 620, 410, 470, 305],
  ["2026-08-19", 710, 460, 535, 342],
  ["2026-08-20", 680, 505, 512, 381],
  ["2026-08-21", 790, 530, 601, 397],
  ["2026-08-22", 860, 575, 648, 430],
  ["2026-08-23", 805, 550, 610, 416],
  ["2026-08-24", 925, 615, 701, 462],
  ["2026-08-25", 880, 590, 669, 448],
  ["2026-08-26", 990, 660, 752, 501],
  ["2026-08-27", 1_040, 705, 794, 536],
  ["2026-08-28", 960, 680, 731, 517],
  ["2026-08-29", 1_110, 740, 842, 563],
  ["2026-08-30", 1_185, 795, 901, 604],
  ["2026-08-31", 1_260, 840, 958, 638],
] as const;

const dailyRow = (props: {
  appId: string;
  day: string;
  osName: string;
  started: number;
  proofs: number;
  dayIndex: number;
}): DailyRow => {
  const completed = Math.round(props.started * 0.84);

  return {
    appId: props.appId,
    day: props.day,
    os_name: props.osName,
    n_users_started_selfie_check_flow: props.started,
    n_proofs: props.proofs,
    n_proof_users: Math.round(props.proofs * 0.68),
    cumulative_n_proofs: 4_000 + props.dayIndex * 900 + props.proofs,
    cumulative_n_proof_users:
      2_700 + props.dayIndex * 610 + Math.round(props.proofs * 0.68),
    n_face_auth_started_sessions: props.started,
    n_face_auth_completed_sessions: completed,
    p_face_auth_completion: completed / props.started,
  };
};

/** Deterministic fixture used only by the development analytics preview. */
export const getMockAnalytics = (
  appId: string,
): { totals: TotalsRow; daily: readonly DailyRow[] } => ({
  totals: {
    appId,
    n_users_started_selfie_check_flow: 18_420,
    n_proofs: 12_670,
    n_proof_users: 8_342,
    n_face_auth_started_sessions: 16_320,
    n_face_auth_completed_sessions: 13_910,
    p_face_auth_completion: 0.852,
  },
  daily: DAILY_COUNTS.flatMap(
    ([day, iosStarted, androidStarted, iosProofs, androidProofs], dayIndex) => [
      dailyRow({
        appId,
        day,
        osName: "iOS",
        started: iosStarted,
        proofs: iosProofs,
        dayIndex,
      }),
      dailyRow({
        appId,
        day,
        osName: "Android",
        started: androidStarted,
        proofs: androidProofs,
        dayIndex,
      }),
    ],
  ),
});
