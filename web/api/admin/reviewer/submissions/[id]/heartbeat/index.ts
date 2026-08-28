import { authenticateReviewerApiRequest } from "@/api/admin/reviewer/auth";
import {
  isUuid,
  readClaimedWriteBody,
} from "@/api/admin/reviewer/request-schema";
import {
  invalidBodyResponse,
  invalidReviewIdResponse,
  reviewerApiJson,
  sanitizedWorkflowError,
  workflowConflictResponse,
  workflowSuccessResponse,
} from "@/api/admin/reviewer/response";
import {
  heartbeatReviewSubmission,
  reconcileHeartbeatReviewSubmission,
} from "@/api/helpers/reviewer-workflow";
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

  const body = await readClaimedWriteBody(req);
  if (!body) return invalidBodyResponse();

  try {
    const input = {
      submissionId: id,
      claimToken: body.claimToken,
      expectedReviewVersion: body.expectedReviewVersion,
      actor: auth.user,
    };
    const submission = await heartbeatReviewSubmission(input);
    if (submission) return workflowSuccessResponse(submission);

    const recovered = await reconcileHeartbeatReviewSubmission(input);
    return recovered
      ? workflowSuccessResponse(recovered)
      : workflowConflictResponse();
  } catch (error) {
    try {
      const recovered = await reconcileHeartbeatReviewSubmission({
        submissionId: id,
        claimToken: body.claimToken,
        expectedReviewVersion: body.expectedReviewVersion,
        actor: auth.user,
      });
      if (recovered) return workflowSuccessResponse(recovered);
    } catch (reconciliationError) {
      logger.error("Failed to reconcile review heartbeat outcome", {
        reviewId: id,
        actorSubject: auth.user.subject,
        ...sanitizedWorkflowError(reconciliationError),
      });
    }
    logger.error("Failed to heartbeat review submission", {
      reviewId: id,
      actorSubject: auth.user.subject,
      ...sanitizedWorkflowError(error),
    });
    return reviewerApiJson(
      { error: "Unable to update review workflow" },
      { status: 500 },
    );
  }
}
