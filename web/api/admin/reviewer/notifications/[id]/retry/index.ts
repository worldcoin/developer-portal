import { authenticateReviewerApiRequest } from "@/api/admin/reviewer/auth";
import { isUuid, readEmptyJsonBody } from "@/api/admin/reviewer/request-schema";
import {
  invalidBodyResponse,
  reviewerApiJson,
  sanitizedWorkflowError,
  workflowConflictResponse,
} from "@/api/admin/reviewer/response";
import { retryReviewNotification } from "@/api/helpers/reviewer-notifications";
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
  if (!(await readEmptyJsonBody(req))) return invalidBodyResponse();

  try {
    const notification = await retryReviewNotification({
      notificationId: id,
      actor: auth.user,
    });
    return notification
      ? reviewerApiJson({ notification })
      : workflowConflictResponse();
  } catch (error) {
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
