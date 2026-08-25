import {
  addSandboxBetaTester,
  removeSandboxBetaTester,
} from "@/api/helpers/app-store-connect/beta-tester-handler";
import { getInternalDashboardGraphqlClientForUser } from "@/api/helpers/graphql";
import { authenticateAdminRequest } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getRequestSdk } from "./graphql/get-sandbox-request-ios-for-processing.generated";
import { getSdk as getStatusSdk } from "./graphql/update-sandbox-request-ios-status.generated";

const REQUEST_ID_PATTERN = /^sbx_req_[a-zA-Z0-9]+$/;

type RequestedStatus = "approved" | "rejected" | "revoked";
// `revoking` is no longer produced here, but rows written by the previous
// implementation may still hold it, so it stays a legal starting state.
type StoredStatus = "pending" | RequestedStatus | "revoking";
type ProcessingStage =
  | "status_check"
  | "testflight_update"
  | "portal_status_update"
  | "revocation_finalize";

type StatusCommand = {
  status: RequestedStatus;
  rejectionReason: string | null;
};

const isStoredStatus = (value: unknown): value is StoredStatus =>
  value === "pending" ||
  value === "approved" ||
  value === "rejected" ||
  value === "revoking" ||
  value === "revoked";

const parseCommand = async (
  req: NextRequest,
): Promise<StatusCommand | null> => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return null;
  }

  if (!body || typeof body !== "object" || !("status" in body)) return null;
  if (
    body.status !== "approved" &&
    body.status !== "rejected" &&
    body.status !== "revoked"
  ) {
    return null;
  }

  const rawReason = "reason" in body ? body.reason : null;
  if (rawReason !== null && typeof rawReason !== "string") return null;

  const rejectionReason =
    typeof rawReason === "string"
      ? rawReason.replace(/\p{Cc}/gu, " ").trim()
      : "";

  return {
    status: body.status,
    rejectionReason:
      body.status === "rejected" && rejectionReason ? rejectionReason : null,
  };
};

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const admin = await authenticateAdminRequest(req.headers);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await props.params;
  if (id.length > 100 || !REQUEST_ID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "Invalid iOS sandbox request id" },
      { status: 400 },
    );
  }

  const command = await parseCommand(req);
  if (!command) {
    return NextResponse.json(
      { error: "Invalid status or rejection reason" },
      { status: 400 },
    );
  }

  let processingStage: ProcessingStage = "status_check";

  try {
    const client = await getInternalDashboardGraphqlClientForUser(admin);
    const requestSdk = getRequestSdk(client);
    const statusSdk = getStatusSdk(client);

    const readRequest = async () => {
      const data = await requestSdk.GetSandboxRequestIosForProcessing({ id });
      const request = data.sandbox_access_request_ios_by_pk;
      if (request && !isStoredStatus(request.status)) {
        throw new Error(`Unexpected iOS sandbox status: ${request.status}`);
      }
      return request ?? null;
    };

    // Unconditional update by id (last-write-wins). Apple calls and status
    // sets are idempotent, so a concurrent write self-heals on the next action
    // rather than needing in-request compare-and-swap.
    const setStatus = async (
      set: Record<string, string | null> & { status: StoredStatus },
    ) => {
      await statusSdk.UpdateSandboxRequestIosStatus({ id, set });
    };

    const respond = (changed: boolean, status: StoredStatus | null) =>
      NextResponse.json({ success: true, changed, status });

    const unsupportedTransition = () =>
      NextResponse.json(
        { error: "Unsupported status transition" },
        { status: 400 },
      );

    const request = await readRequest();
    if (!request) return respond(false, null);

    if (command.status === "rejected") {
      if (request.status === "rejected") return respond(false, "rejected");
      if (request.status !== "pending") return unsupportedTransition();

      processingStage = "portal_status_update";
      await setStatus({
        status: "rejected",
        rejection_reason: command.rejectionReason,
      });
      return respond(true, "rejected");
    }

    if (command.status === "approved") {
      if (request.status !== "pending" && request.status !== "approved") {
        return unsupportedTransition();
      }

      // Enroll first, then record. Idempotent, so re-approving just re-ensures
      // TestFlight without a portal write.
      processingStage = "testflight_update";
      await addSandboxBetaTester(request.asc_email);
      if (request.status === "approved") return respond(false, "approved");

      processingStage = "portal_status_update";
      await setStatus({
        status: "approved",
        approved_at: new Date().toISOString(),
      });
      return respond(true, "approved");
    }

    // command.status === "revoked"
    if (
      request.status !== "approved" &&
      request.status !== "revoking" &&
      request.status !== "revoked"
    ) {
      return unsupportedTransition();
    }

    // Remove from Apple first: if that fails the row stays approved (fail
    // closed on the portal side while access is already gone), and a retry is
    // safe because removal is idempotent.
    processingStage = "testflight_update";
    await removeSandboxBetaTester(request.asc_email);
    if (request.status === "revoked") return respond(false, "revoked");

    processingStage = "revocation_finalize";
    await setStatus({
      status: "revoked",
      revoked_at: new Date().toISOString(),
    });
    return respond(true, "revoked");
  } catch (error) {
    logger.error("Failed to update iOS sandbox request status", {
      requestId: id,
      requestedStatus: command.status,
      adminSubject: admin.subject,
      dependency:
        processingStage === "testflight_update"
          ? "app_store_connect"
          : "hasura",
      processingStage,
      failureClass: error instanceof Error ? error.name : "UnknownError",
      error,
    });
    return NextResponse.json(
      {
        error: "Unable to update iOS sandbox request",
        failureStage: processingStage,
      },
      { status: 503 },
    );
  }
}
