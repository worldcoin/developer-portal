import { authenticateReviewerApiRequest } from "@/api/admin/reviewer/auth";
import { isUuid, readRetryBody } from "@/api/admin/reviewer/request-schema";
import {
  invalidBodyResponse,
  invalidReviewIdResponse,
  reviewerApiJson,
  sanitizedWorkflowError,
  workflowConflictResponse,
} from "@/api/admin/reviewer/response";
import {
  reconcileReviewerAssetSnapshotRepairRetry,
  retryReviewerAssetSnapshotRepair,
} from "@/api/helpers/reviewer-asset-snapshot-repair";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateReviewerApiRequest(req);
  if (!auth.ok) return auth.response;

  const { id } = await props.params;
  if (!isUuid(id)) return invalidReviewIdResponse();
  const body = await readRetryBody(req);
  if (!body) return invalidBodyResponse();

  const { operationId } = body;
  const input = { submissionId: id, operationId, actor: auth.user };
  try {
    const repair = await retryReviewerAssetSnapshotRepair(input);
    return repair
      ? reviewerApiJson({ assetSnapshotRepair: repair })
      : workflowConflictResponse();
  } catch (error) {
    try {
      const recovered = await reconcileReviewerAssetSnapshotRepairRetry(input);
      if (recovered) {
        return reviewerApiJson({ assetSnapshotRepair: recovered });
      }
    } catch (reconciliationError) {
      logger.error("Failed to reconcile reviewer asset repair retry", {
        reviewId: id,
        actorSubject: auth.user.subject,
        ...sanitizedWorkflowError(reconciliationError),
      });
    }

    logger.error("Failed to retry reviewer asset snapshot repair", {
      reviewId: id,
      actorSubject: auth.user.subject,
      ...sanitizedWorkflowError(error),
    });
    return reviewerApiJson(
      { error: "Unable to retry reviewer asset preparation" },
      { status: 500 },
    );
  }
}
