import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getReconcileVerificationStatsSdk } from "./graphql/reconcile-verification-stats.generated";

// Each batch is its own transaction under the database advisory lock; the cursor in
// verification_reconciliation_state resumes across runs, so stopping at the budget is safe.
const TIME_BUDGET_MS = 50_000;
const BATCH_SIZE = 500;
const LOCK_RETRY_DELAY_MS = 2_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) return errorResponse;

  try {
    const client = await getAPIServiceGraphqlClient();
    const sdk = getReconcileVerificationStatsSdk(client);

    const startedAt = Date.now();
    let batches = 0;
    let repaired = 0;
    let alerts = 0;
    let status = "not_run";

    while (Date.now() - startedAt < TIME_BUDGET_MS) {
      const res = await sdk.ReconcileVerificationStats({
        batch_size: BATCH_SIZE,
      });
      const row = res.reconcile_verification_stats?.[0];
      if (!row) {
        throw new Error("reconcile_verification_stats returned no rows");
      }

      status = row.status;
      if (status === "lock_not_acquired") {
        // The 5-minute rollup holds the lock only briefly; retry within the budget.
        await sleep(LOCK_RETRY_DELAY_MS);
        continue;
      }

      batches += 1;
      repaired += row.repaired;
      alerts += row.alerts;
      if (row.alerts > 0) {
        logger.error("Verification stats reconciliation drift", { row });
      }
      if (status !== "continue") break;
    }

    logger.info("Verification stats reconciliation run", {
      batches,
      repaired,
      alerts,
      status,
    });
    return NextResponse.json({
      success: true,
      status,
      batches,
      repaired,
      alerts,
    });
  } catch (error) {
    logger.error("Error reconciling verification stats", { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
