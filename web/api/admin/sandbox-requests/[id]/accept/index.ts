import { getInternalDashboardGraphqlClientForUser } from "@/api/helpers/graphql";
import { sendEmail } from "@/api/helpers/send-email";
import { authenticateAdminRequest } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk } from "./graphql/mark-sandbox-invite-sent.generated";

const SANDBOX_REQUEST_ID_REGEX = /^sbxreq_[a-zA-Z0-9]+$/;
const isSandboxRequestId = (id: string) =>
  id.length <= 100 && SANDBOX_REQUEST_ID_REGEX.test(id);

/**
 * Approves a sandbox request after an authenticated dashboard user grants
 * access in Google Play Console. The mutation is one-way and idempotent:
 * accepted requests keep their original processed_at timestamp. This
 * low-stakes acknowledgement is intentionally available to every authenticated
 * dashboard user.
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

  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const emailFrom = process.env.SENDGRID_EMAIL_FROM;
  const templateId = process.env.SENDGRID_SANDBOX_ACCESS_APPROVED_TEMPLATE_ID;
  if (!sendgridApiKey || !emailFrom || !templateId) {
    logger.error("Sandbox approval email is not configured", {
      hasApiKey: Boolean(sendgridApiKey),
      hasFrom: Boolean(emailFrom),
      hasTemplateId: Boolean(templateId),
    });
    return NextResponse.json(
      { error: "Sandbox approval email is not configured" },
      { status: 503 },
    );
  }

  try {
    const client = await getInternalDashboardGraphqlClientForUser(admin);
    const result = await getSdk(client).MarkSandboxInviteSent({
      id,
      processed_at: new Date().toISOString(),
    });
    const update = result.update_sandbox_access_request;

    if (update?.affected_rows === 0) {
      return NextResponse.json({ success: true, changed: false });
    }

    const approvedRequest = update?.returning[0];
    if (update?.affected_rows !== 1 || !approvedRequest) {
      throw new Error("Sandbox approval did not return the updated request");
    }

    const username =
      approvedRequest.user?.name?.trim() ||
      approvedRequest.user?.email ||
      approvedRequest.google_email;

    try {
      await sendEmail({
        apiKey: sendgridApiKey,
        from: emailFrom,
        to: approvedRequest.google_email,
        templateId,
        templateData: {
          username,
          approved_email: approvedRequest.google_email,
        },
      });
    } catch (error) {
      logger.error("Failed to send sandbox approval email", {
        requestId: id,
        googleEmail: approvedRequest.google_email,
        adminSubject: admin.subject,
        error,
      });
      return NextResponse.json(
        { error: "Unable to send sandbox approval email" },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      changed: true,
    });
  } catch (error) {
    logger.error("Failed to approve sandbox request", {
      requestId: id,
      adminSubject: admin.subject,
      error,
    });
    return NextResponse.json(
      { error: "Unable to update sandbox request" },
      { status: 503 },
    );
  }
}
