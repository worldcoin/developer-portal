import "server-only";

// Same check as lib/utils' checkIfProduction, inlined so the flag module
// doesn't drag lib/utils' IDKit dependency chain into every importer.
const isProduction = process.env.NEXT_PUBLIC_APP_ENV === "production";

/**
 * Teams whose members see the WID sandbox distribution tile. Low-churn and
 * engineer-managed, so hardcoded (PARTNER_TEAM_IDS precedent); move behind
 * SSM inside the flag provider if churn grows — call sites won't change.
 */
export const SANDBOX_TEAMS: string[] = isProduction
  ? [
      // TODO: prod team ids (e.g. World ID TFH team) before enabling in prod.
    ]
  : [
      // TODO: staging + local dev team ids.
      "team_4dba92ae461f1fa715e31e553d04b0ce",
      "team_11b24953b07d196ed3d95d60776598d2",
    ];
