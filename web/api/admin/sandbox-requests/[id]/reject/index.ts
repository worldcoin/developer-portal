import { getInternalDashboardGraphqlClientForUser } from "@/api/helpers/graphql";
import { sendEmail } from "@/api/helpers/send-email";
import { authenticateAdminRequest } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk } from "./graphql/delete-pending-sandbox-request.generated";

const SANDBOX_REQUEST_ID_REGEX = /^sbxreq_[a-zA-Z0-9]+$/;
const MAX_REASON_LENGTH = 1000;

const isSandboxRequestId = (id: string) =>
  id.length <= 100 && SANDBOX_REQUEST_ID_REGEX.test(id);

const readReason = async (req: NextRequest) => {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return null;
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("reason" in body) ||
    typeof body.reason !== "string"
  ) {
    return null;
  }

  const reason = body.reason.trim();
  return reason.length > 0 && reason.length <= MAX_REASON_LENGTH
    ? reason
    : null;
};

/**
 * Rejects a pending sandbox request by deleting it, then sending the
 * rejection email. Mirrors accept: the mutation claims the row (with
 * returning) before SendGrid runs.
 */
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const admin = await authenticateAdminRequest(req.headers);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  if (!isSandboxRequestId(id)) {
    return NextResponse.json(
      { error: "Invalid sandbox request id" },
      { status: 400 },
    );
  }

  const reason = await readReason(req);
  if (!reason) {
    return NextResponse.json(
      {
        error: `Rejection reason is required and must be at most ${MAX_REASON_LENGTH} characters`,
      },
      { status: 400 },
    );
  }

  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const emailFrom = process.env.SENDGRID_EMAIL_FROM;
  const templateId = process.env.SENDGRID_SANDBOX_ACCESS_REJECTED_TEMPLATE_ID;
  if (!sendgridApiKey || !emailFrom || !templateId) {
    logger.error("Sandbox rejection email is not configured", {
      hasApiKey: Boolean(sendgridApiKey),
      hasFrom: Boolean(emailFrom),
      hasTemplateId: Boolean(templateId),
    });
    return NextResponse.json(
      { error: "Sandbox rejection email is not configured" },
      { status: 503 },
    );
  }

  try {
    const client = await getInternalDashboardGraphqlClientForUser(admin);
    const result = await getSdk(client).DeletePendingSandboxRequest({ id });
    const deletion = result.delete_sandbox_access_request;

    if (deletion?.affected_rows === 0) {
      return NextResponse.json({ success: true, changed: false });
    }

    const rejectedRequest = deletion?.returning[0];
    if (deletion?.affected_rows !== 1 || !rejectedRequest) {
      throw new Error("Sandbox rejection did not return the deleted request");
    }

    const username =
      rejectedRequest.user?.name?.trim() ||
      rejectedRequest.user?.email ||
      rejectedRequest.google_email;

    try {
      await sendEmail({
        apiKey: sendgridApiKey,
        from: emailFrom,
        to: rejectedRequest.google_email,
        templateId,
        templateData: {
          username,
          approved_email: rejectedRequest.google_email,
          reason,
        },
      });
    } catch (error) {
      logger.error("Failed to send sandbox rejection email", {
        requestId: id,
        googleEmail: rejectedRequest.google_email,
        adminSubject: admin.subject,
        error,
      });
      return NextResponse.json(
        { error: "Unable to send sandbox rejection email" },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, changed: true });
  } catch (error) {
    logger.error("Failed to reject sandbox request", {
      requestId: id,
      adminSubject: admin.subject,
      error,
    });
    return NextResponse.json(
      { error: "Unable to delete sandbox request" },
      { status: 503 },
    );
  }
}
