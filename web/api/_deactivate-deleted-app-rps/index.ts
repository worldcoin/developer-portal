import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { submitManagedRpDeactivation } from "@/api/helpers/rp-registration-flows";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getDeletedAppRpsSdk } from "./graphql/get-deleted-app-rps.generated";

// Only reconcile rows whose last update is older than this, so we don't stomp
// a deactivation transaction the delete flow just submitted and is still
// settling on-chain. Matches the rp-status pending grace period.
const RECONCILE_GRACE_MS = 5 * 60 * 1000;

// Bound on-chain submissions per run to avoid a thundering herd. The cron runs
// periodically, so any remainder (e.g. a backlog of apps deleted before this
// existed) is drained over subsequent passes.
const MAX_PER_RUN = 10;

/**
 * Reconciliation cron: deactivate the managed RP signer on-chain for apps that
 * have been soft-deleted but whose RP is still live. This is the backstop for
 * the best-effort deactivation in the delete flow — it catches delete-time
 * failures and backfills apps that were deleted before delete-time
 * deactivation existed.
 *
 * Safe to retry / run repeatedly: submitManagedRpDeactivation gates every
 * on-chain submission on a fresh on-chain read, so it never double-toggles.
 */
export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const client = await getAPIServiceGraphqlClient();
  const before = new Date(Date.now() - RECONCILE_GRACE_MS).toISOString();

  const { rp_registration } = await getDeletedAppRpsSdk(
    client,
  ).GetDeletedAppRps({ before, limit: MAX_PER_RUN });

  const candidates = rp_registration ?? [];
  if (candidates.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  logger.info("Reconciling RP deactivation for deleted apps", {
    candidate_count: candidates.length,
  });

  let submitted = 0;
  let skipped = 0;
  let failed = 0;

  // Sequential to keep on-chain submission load bounded. Each candidate is
  // isolated in its own try/catch so a single bad row (an unexpected throw
  // from a GraphQL/RPC call) is counted and logged rather than aborting the
  // run and blocking reconciliation for the rest of the batch.
  for (const candidate of candidates) {
    try {
      const result = await submitManagedRpDeactivation({
        client,
        appId: candidate.app_id,
      });

      if (!result.ok) {
        failed += 1;
        logger.error("Failed to deactivate RP for deleted app", {
          app_id: candidate.app_id,
          rp_id: candidate.rp_id,
          code: result.code,
          detail: result.detail,
        });
      } else if (result.outcome === "submitted") {
        submitted += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      failed += 1;
      logger.error("Unexpected error deactivating RP for deleted app", {
        error,
        app_id: candidate.app_id,
        rp_id: candidate.rp_id,
      });
    }
  }

  logger.info("Finished reconciling RP deactivation for deleted apps", {
    candidate_count: candidates.length,
    submitted,
    skipped,
    failed,
  });

  return new NextResponse(null, { status: 204 });
}
