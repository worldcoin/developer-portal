import { authenticateReviewerApiRequest } from "@/api/admin/reviewer/auth";
import { isUuid, readRetryBody } from "@/api/admin/reviewer/request-schema";
import {
  invalidBodyResponse,
  reviewerApiJson,
  sanitizedWorkflowError,
  workflowConflictResponse,
} from "@/api/admin/reviewer/response";
import {
  reconcileRetryReviewNotification,
  retryReviewNotification,
} from "@/api/helpers/reviewer-notifications";
import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateReviewerApiRequest(req);
  if (!auth.ok) return auth.response;

  const { id } = await props.params;
  if (!isUuid(id)) {
    return reviewerApiJson(
      { error: "Invalid notification id" },
      { status: 400 },
    );
  }
  const body = await readRetryBody(req);
  if (!body) return invalidBodyResponse();
  const { operationId } = body;

  try {
    const notification = await retryReviewNotification({
      notificationId: id,
      operationId,
      actor: auth.user,
    });
    return notification
      ? reviewerApiJson({ notification })
      : workflowConflictResponse();
  } catch (error) {
    try {
      const recovered = await reconcileRetryReviewNotification({
        notificationId: id,
        operationId,
        actor: auth.user,
      });
      if (recovered) return reviewerApiJson({ notification: recovered });
    } catch (reconciliationError) {
      logger.error("Failed to reconcile review notification retry", {
        notificationId: id,
        actorSubject: auth.user.subject,
        ...sanitizedWorkflowError(reconciliationError),
      });
    }
    logger.error("Failed to retry review notification", {
      notificationId: id,
      actorSubject: auth.user.subject,
      ...sanitizedWorkflowError(error),
    });
    return reviewerApiJson(
      { error: "Unable to retry review notification" },
      { status: 500 },
    );
  }
}
