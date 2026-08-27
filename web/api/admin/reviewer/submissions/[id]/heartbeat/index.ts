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
import { heartbeatReviewSubmission } from "@/api/helpers/reviewer-workflow";
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
    const submission = await heartbeatReviewSubmission({
      submissionId: id,
      claimToken: body.claimToken,
      expectedReviewVersion: body.expectedReviewVersion,
      actor: auth.user,
    });
    return submission
      ? workflowSuccessResponse(submission)
      : workflowConflictResponse();
  } catch (error) {
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
