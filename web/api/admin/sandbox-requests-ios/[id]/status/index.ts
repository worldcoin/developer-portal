import { getInternalDashboardGraphqlClientForUser } from "@/api/helpers/graphql";
import {
  addSandboxBetaTester,
  removeSandboxBetaTester,
} from "@/api/helpers/app-store-connect/beta-tester-handler";
import { authenticateAdminRequest } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getSandboxRequestIosForProcessingSdk } from "./graphql/get-sandbox-request-ios-for-processing.generated";
import { getSdk } from "./graphql/update-sandbox-request-ios-status.generated";

const SANDBOX_REQUEST_IOS_ID_REGEX = /^sbx_req_[a-zA-Z0-9]+$/;
type FinalStatus = "approved" | "rejected" | "revoked";
type ProcessingStage =
  | "status_check"
  | "testflight_update"
  | "portal_status_update"
  | "status_recheck"
  | "testflight_reconciliation";

const isSandboxRequestIosId = (id: string) =>
  id.length <= 100 && SANDBOX_REQUEST_IOS_ID_REGEX.test(id);

const isFinalStatus = (status: string): status is FinalStatus =>
  status === "approved" || status === "rejected" || status === "revoked";

const canTransition = (
  from: string,
  to: FinalStatus,
): from is "pending" | "approved" =>
  (from === "pending" && (to === "approved" || to === "rejected")) ||
  (from === "approved" && to === "revoked");

const syncSandboxBetaTester = (status: FinalStatus, email: string) =>
  status === "approved"
    ? addSandboxBetaTester(email)
    : removeSandboxBetaTester(email);

const readStatus = async (req: NextRequest): Promise<FinalStatus | null> => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return null;
  }

  if (!body || typeof body !== "object" || !("status" in body)) {
    return null;
  }

  return body.status === "approved" ||
    body.status === "rejected" ||
    body.status === "revoked"
    ? body.status
    : null;
};

/**
 * Approvals enroll in TestFlight before persisting `approved`, so a failed
 * enrollment never produces a false-positive approval. Rejections and
 * revocations persist their terminal state first, then remove the tester, so a
 * concurrent approval repair cannot re-enroll after revocation commits. Every
 * successful TestFlight call is followed by a status check and reconciliation.
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
  if (!isSandboxRequestIosId(id)) {
    return NextResponse.json(
      { error: "Invalid iOS sandbox request id" },
      { status: 400 },
    );
  }

  const status = await readStatus(req);
  if (!status) {
    return NextResponse.json(
      { error: "Status must be approved, rejected, or revoked" },
      { status: 400 },
    );
  }

  let processingStage: ProcessingStage = "status_check";

  try {
    const client = await getInternalDashboardGraphqlClientForUser(admin);
    const readCurrentRequest = async () => {
      const lookup = await getSandboxRequestIosForProcessingSdk(
        client,
      ).GetSandboxRequestIosForProcessing({ id });
      return lookup.sandbox_access_request_ios_by_pk;
    };
    const readCurrentFinalRequest = async () => {
      const currentRequest = await readCurrentRequest();
      const currentStatus = currentRequest?.status;
      if (!currentRequest || !currentStatus || !isFinalStatus(currentStatus)) {
        throw new Error(
          "iOS sandbox status check did not resolve to a final state",
        );
      }
      return { ...currentRequest, status: currentStatus };
    };
    const verifyAndReconcileTestFlight = async (appliedStatus: FinalStatus) => {
      processingStage = "status_recheck";
      const currentRequest = await readCurrentFinalRequest();

      if (currentRequest.status !== appliedStatus) {
        processingStage = "testflight_reconciliation";
        await syncSandboxBetaTester(
          currentRequest.status,
          currentRequest.asc_email,
        );
      }

      return currentRequest;
    };

    const sandboxRequest = await readCurrentRequest();

    if (!sandboxRequest) {
      return NextResponse.json({ success: true, changed: false, status: null });
    }

    if (sandboxRequest.status === status) {
      // Re-applying the requested final state makes a retry repair any earlier
      // partial failure between Hasura and App Store Connect. Recheck after the
      // call in case an overlapping revocation made `revoked` authoritative.
      processingStage = "testflight_reconciliation";
      await syncSandboxBetaTester(status, sandboxRequest.asc_email);
      const finalRequest = await verifyAndReconcileTestFlight(status);
      return NextResponse.json({
        success: true,
        changed: false,
        status: finalRequest.status,
      });
    }

    if (!canTransition(sandboxRequest.status, status)) {
      return NextResponse.json(
        { error: "Unsupported status transition" },
        { status: 400 },
      );
    }

    if (status === "approved") {
      processingStage = "testflight_update";
      await syncSandboxBetaTester(status, sandboxRequest.asc_email);
    }

    processingStage = "portal_status_update";
    const result = await getSdk(client).UpdateSandboxRequestIosStatus({
      id,
      from_status: sandboxRequest.status,
      status,
      revoked_at: status === "revoked" ? new Date().toISOString() : null,
      revoked_by: status === "revoked" ? admin.subject : null,
    });
    const update = result.update_sandbox_access_request_ios;

    if (update?.affected_rows === 0) {
      processingStage = "status_recheck";
      const finalRequest = await readCurrentFinalRequest();

      // A conflicting concurrent action may have changed TestFlight after our
      // first call. Re-apply the state that actually won the database race.
      processingStage = "testflight_reconciliation";
      await syncSandboxBetaTester(finalRequest.status, finalRequest.asc_email);
      const verifiedRequest = await verifyAndReconcileTestFlight(
        finalRequest.status,
      );

      return NextResponse.json({
        success: true,
        changed: false,
        status: verifiedRequest.status,
      });
    }

    if (update?.affected_rows !== 1 || update.returning[0]?.status !== status) {
      throw new Error(
        "iOS sandbox status update did not return exactly one expected row",
      );
    }

    if (status !== "approved") {
      processingStage = "testflight_reconciliation";
      await syncSandboxBetaTester(status, sandboxRequest.asc_email);
    }

    const finalRequest = await verifyAndReconcileTestFlight(status);

    return NextResponse.json({
      success: true,
      changed: true,
      status: finalRequest.status,
    });
  } catch (error) {
    logger.error("Failed to update iOS sandbox request status", {
      requestId: id,
      requestedStatus: status,
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
      },
      { status: 503 },
    );
  }
}
