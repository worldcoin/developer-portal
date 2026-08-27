import { authenticateReviewerApiRequest } from "@/api/admin/reviewer/auth";
import {
  isUuid,
  readChecklistWriteBody,
} from "@/api/admin/reviewer/request-schema";
import {
  invalidBodyResponse,
  invalidReviewIdResponse,
  reviewerApiJson,
  sanitizedWorkflowError,
  workflowConflictResponse,
  workflowSuccessResponse,
} from "@/api/admin/reviewer/response";
import { saveReviewChecklist } from "@/api/helpers/reviewer-workflow";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateReviewerApiRequest(req);
  if (!auth.ok) return auth.response;

  const { id } = await props.params;
  if (!isUuid(id)) return invalidReviewIdResponse();

  const body = await readChecklistWriteBody(req);
  if (!body) return invalidBodyResponse();

  try {
    const submission = await saveReviewChecklist({
      submissionId: id,
      claimToken: body.claimToken,
      expectedReviewVersion: body.expectedReviewVersion,
      checklistVersion: body.checklistVersion,
      checklist: body.checklist,
      actor: auth.user,
    });
    return submission
      ? workflowSuccessResponse(submission)
      : workflowConflictResponse();
  } catch (error) {
    logger.error("Failed to save review checklist", {
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
