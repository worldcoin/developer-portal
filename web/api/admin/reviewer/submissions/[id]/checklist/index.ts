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
import {
  fetchReviewChecklistContext,
  saveReviewChecklist,
} from "@/api/helpers/reviewer-workflow";
import { logger } from "@/lib/logger";
import {
  REVIEW_CHECKLIST_VERSION,
  createChecklistDefinitionSnapshot,
  isReviewChecklistVersionSupported,
  validateChecklistDraft,
} from "@/scenes/Admin/reviewer/checklist";
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
    const context = await fetchReviewChecklistContext(id);
    if (!context) return workflowConflictResponse();

    if (!isReviewChecklistVersionSupported(body.checklistVersion)) {
      return invalidBodyResponse();
    }

    if (
      (context.checklistVersion !== null &&
        !isReviewChecklistVersionSupported(context.checklistVersion)) ||
      body.checklistVersion !==
        (context.checklistVersion ?? REVIEW_CHECKLIST_VERSION)
    ) {
      return workflowConflictResponse();
    }

    if (
      validateChecklistDraft(
        context.appMode,
        body.checklist,
        body.checklistVersion,
      ).length > 0
    ) {
      return invalidBodyResponse();
    }

    const definitionSnapshot = createChecklistDefinitionSnapshot(
      context.appMode,
      body.checklistVersion,
    );
    if (!definitionSnapshot) return workflowConflictResponse();

    const submission = await saveReviewChecklist({
      submissionId: id,
      claimToken: body.claimToken,
      expectedReviewVersion: body.expectedReviewVersion,
      checklistVersion: body.checklistVersion,
      checklist: { ...body.checklist, definitionSnapshot },
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
