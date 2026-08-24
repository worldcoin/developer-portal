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
const MAX_REJECTION_REASON_LENGTH = 500;

type RequestedStatus = "approved" | "rejected" | "revoked";
type StoredStatus = "pending" | RequestedStatus | "revoking";
type ProcessingStage =
  | "status_check"
  | "testflight_update"
  | "portal_status_update"
  | "revocation_lock"
  | "revocation_finalize"
  | "status_recheck"
  | "testflight_reconciliation"
  | "revocation_rollback";

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
      ? rawReason.replace(/[\u0000-\u001f\u007f]/g, " ").trim()
      : "";
  if (rejectionReason.length > MAX_REJECTION_REASON_LENGTH) return null;

  return {
    status: body.status,
    rejectionReason:
      body.status === "rejected" && rejectionReason ? rejectionReason : null,
  };
};

const isUncertainAppStoreConnectFailure = (error: unknown) => {
  if (
    !(error instanceof Error) ||
    error.name !== "AppStoreConnectRequestError"
  ) {
    return false;
  }

  const status = "status" in error ? error.status : undefined;
  return typeof status !== "number" || status === 429 || status >= 500;
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
  let failureStatus: StoredStatus | null | undefined;

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
      return request ? { ...request, status: request.status } : null;
    };

    const transition = async (
      fromStatus: StoredStatus,
      set: Record<string, string | null> & { status: StoredStatus },
    ) => {
      const data = await statusSdk.UpdateSandboxRequestIosStatus({
        id,
        from_status: fromStatus,
        set,
      });
      const update = data.update_sandbox_access_request_ios;

      if (!update || ![0, 1].includes(update.affected_rows)) {
        throw new Error("iOS sandbox status update returned an invalid count");
      }
      if (
        update.affected_rows === 1 &&
        update.returning[0]?.status !== set.status
      ) {
        throw new Error("iOS sandbox status update returned an invalid state");
      }

      return update.affected_rows === 1;
    };

    // After any Apple mutation, repeatedly reread the database and repair Apple
    // to the state that won. The loop is bounded to avoid retry storms.
    const reconcileAfterApple = async (
      email: string,
      testerIsEnrolled: boolean,
    ) => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        processingStage = "status_recheck";
        const current = await readRequest();
        const shouldBeEnrolled = current?.status === "approved";
        if (shouldBeEnrolled === testerIsEnrolled) return current;

        processingStage = "testflight_reconciliation";
        await (shouldBeEnrolled
          ? addSandboxBetaTester(email)
          : removeSandboxBetaTester(email));
        testerIsEnrolled = shouldBeEnrolled;
      }

      throw new Error(
        "iOS sandbox status did not stabilize after reconciliation",
      );
    };

    const respond = (
      changed: boolean,
      request: Awaited<ReturnType<typeof readRequest>>,
    ) =>
      NextResponse.json({
        success: true,
        changed,
        status: request?.status ?? null,
      });
    const unsupportedTransition = () =>
      NextResponse.json(
        { error: "Unsupported status transition" },
        { status: 400 },
      );

    const request = await readRequest();
    if (!request) return respond(false, null);

    if (command.status === "rejected") {
      if (request.status === "rejected") return respond(false, request);
      if (request.status !== "pending") {
        return unsupportedTransition();
      }

      processingStage = "portal_status_update";
      const changed = await transition("pending", {
        status: "rejected",
        rejection_reason: command.rejectionReason,
      });
      processingStage = "status_recheck";
      const finalRequest = await readRequest();
      if (changed && finalRequest?.status === "pending") {
        throw new Error("Rejected iOS sandbox request remained pending");
      }
      return respond(changed, finalRequest);
    }

    if (command.status === "approved") {
      if (request.status !== "pending" && request.status !== "approved") {
        return unsupportedTransition();
      }

      processingStage = "testflight_update";
      await addSandboxBetaTester(request.asc_email);

      let changed = false;
      if (request.status === "pending") {
        processingStage = "portal_status_update";
        changed = await transition("pending", {
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: admin.subject,
        });
      }

      const finalRequest = await reconcileAfterApple(request.asc_email, true);
      if (!changed && finalRequest?.status === "pending") {
        throw new Error("Approval lost its status update without a winner");
      }
      return respond(changed, finalRequest);
    }

    if (
      request.status !== "approved" &&
      request.status !== "revoking" &&
      request.status !== "revoked"
    ) {
      return unsupportedTransition();
    }

    if (request.status === "revoked") {
      processingStage = "testflight_reconciliation";
      await removeSandboxBetaTester(request.asc_email);
      return respond(
        false,
        await reconcileAfterApple(request.asc_email, false),
      );
    }

    if (request.status === "approved") {
      processingStage = "revocation_lock";
      const locked = await transition("approved", {
        status: "revoking",
      });

      if (!locked) {
        processingStage = "status_recheck";
        const winner = await readRequest();
        if (winner?.status !== "revoking" && winner?.status !== "revoked") {
          return respond(false, winner);
        }
        if (winner.status === "revoked") {
          processingStage = "testflight_reconciliation";
          await removeSandboxBetaTester(request.asc_email);
          return respond(
            false,
            await reconcileAfterApple(request.asc_email, false),
          );
        }
      }
    }

    processingStage = "testflight_update";
    try {
      await removeSandboxBetaTester(request.asc_email);
    } catch (error) {
      failureStatus = "revoking";

      // A known 4xx/configuration failure means Apple did not accept the
      // removal, so release the lock and keep the visible approved state.
      // Timeouts/5xx are ambiguous and stay retryable as `revoking`.
      if (!isUncertainAppStoreConnectFailure(error)) {
        processingStage = "revocation_rollback";
        if (await transition("revoking", { status: "approved" })) {
          failureStatus = "approved";
          processingStage = "testflight_update";
        }
      }
      throw error;
    }

    failureStatus = "revoking";
    processingStage = "revocation_finalize";
    const finalized = await transition("revoking", {
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: admin.subject,
    });
    const finalRequest = await reconcileAfterApple(request.asc_email, false);
    return respond(finalized, finalRequest);
  } catch (error) {
    logger.error("Failed to update iOS sandbox request status", {
      requestId: id,
      requestedStatus: command.status,
      adminSubject: admin.subject,
      dependency:
        processingStage === "testflight_update" ||
        processingStage === "testflight_reconciliation"
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
        ...(failureStatus !== undefined ? { status: failureStatus } : {}),
      },
      { status: 503 },
    );
  }
}
