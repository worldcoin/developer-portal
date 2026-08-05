import { getInternalDashboardGraphqlClientForUser } from "@/api/helpers/graphql";
import { sendEmail } from "@/api/helpers/send-email";
import { authenticateAdminRequest } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getSandboxAccessRequestSdk } from "./graphql/get-sandbox-access-request.generated";
import { getSdk as getMarkSandboxInviteSentSdk } from "./graphql/mark-sandbox-invite-sent.generated";
import { buildSandboxAccessEmail } from "./sandbox-access-email";

const SANDBOX_REQUEST_ID_REGEX = /^sbxreq_[a-zA-Z0-9]+$/;
const isSandboxRequestId = (id: string) =>
  id.length <= 100 && SANDBOX_REQUEST_ID_REGEX.test(id);

/**
 * Approves a sandbox request after an authenticated dashboard user grants
 * access in Google Play Console. Claims the row atomically
 * (`accepted = false` → true), then sends the invite only for the winning
 * claim so concurrent Approves cannot double-email. Idempotent for
 * already-accepted requests.
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
  if (!sendgridApiKey || !emailFrom) {
    logger.error("Sandbox invite email is not configured", {
      hasApiKey: Boolean(sendgridApiKey),
      hasFrom: Boolean(emailFrom),
    });
    return NextResponse.json(
      { error: "Sandbox invite email is not configured" },
      { status: 503 },
    );
  }

  try {
    const client = await getInternalDashboardGraphqlClientForUser(admin);
    const requestResult = await getSandboxAccessRequestSdk(
      client,
    ).GetSandboxAccessRequest({ id });
    const sandboxRequest = requestResult.sandbox_access_request[0];

    if (!sandboxRequest) {
      return NextResponse.json(
        { error: "Sandbox request not found" },
        { status: 404 },
      );
    }

    if (sandboxRequest.accepted) {
      return NextResponse.json({ success: true, changed: false });
    }

    const markResult = await getMarkSandboxInviteSentSdk(
      client,
    ).MarkSandboxInviteSent({
      id,
      processed_at: new Date().toISOString(),
    });
    const claimed =
      markResult.update_sandbox_access_request?.affected_rows === 1;

    // Lost the race to another Approver — they own the invite send.
    if (!claimed) {
      return NextResponse.json({ success: true, changed: false });
    }

    const { subject, text } = buildSandboxAccessEmail({
      androidInstallUrl: process.env.NEXT_PUBLIC_ANDROID_INTERNAL_TEST_URL,
    });

    try {
      await sendEmail({
        apiKey: sendgridApiKey,
        from: emailFrom,
        to: sandboxRequest.google_email,
        subject,
        text,
      });
    } catch (error) {
      // Row is already accepted so retries will not re-send. Surface the
      // failure so an admin can follow up manually.
      logger.error("Failed to send sandbox invite email", {
        requestId: id,
        googleEmail: sandboxRequest.google_email,
        adminSubject: admin.subject,
        error,
      });
      return NextResponse.json(
        { error: "Unable to send sandbox invite email" },
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
