import { getInternalDashboardGraphqlClientForUser } from "@/api/helpers/graphql";
import { AdminHasuraRole, authenticateAdminRequest } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk } from "./graphql/mark-sandbox-invite-sent.generated";

const SANDBOX_REQUEST_ID_REGEX = /^sbxreq_[a-zA-Z0-9]+$/;
const isSandboxRequestId = (id: string) =>
  id.length <= 100 && SANDBOX_REQUEST_ID_REGEX.test(id);

/**
 * Approves a sandbox request after an authenticated dashboard user grants
 * access in Google Play Console. The mutation is one-way and idempotent:
 * accepted requests keep their original processed_at timestamp.
 */
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const admin = await authenticateAdminRequest(req.headers);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (admin.role !== AdminHasuraRole.Write) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await props.params;
  if (!isSandboxRequestId(id)) {
    return NextResponse.json(
      { error: "Invalid sandbox request id" },
      { status: 400 },
    );
  }

  try {
    const client = await getInternalDashboardGraphqlClientForUser(admin);
    const result = await getSdk(client).MarkSandboxInviteSent({
      id,
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      changed: result.update_sandbox_access_request?.affected_rows === 1,
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
