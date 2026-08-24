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
type FinalStatus = "approved" | "rejected";

const isSandboxRequestIosId = (id: string) =>
  id.length <= 100 && SANDBOX_REQUEST_IOS_ID_REGEX.test(id);

const isFinalStatus = (status: string): status is FinalStatus =>
  status === "approved" || status === "rejected";

const canTransition = (
  from: string,
  to: FinalStatus,
): from is "pending" | "approved" =>
  from === "pending" || (from === "approved" && to === "rejected");

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

  return body.status === "approved" || body.status === "rejected"
    ? body.status
    : null;
};

/** Synchronizes TestFlight enrollment, then writes pending → approved/rejected
 * or approved → rejected. The database stays unchanged if App Store Connect
 * fails. */
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
      { error: "Status must be approved or rejected" },
      { status: 400 },
    );
  }

  let processingStage:
    | "request_lookup"
    | "app_store_connect"
    | "status_update" = "request_lookup";

  try {
    const client = await getInternalDashboardGraphqlClientForUser(admin);
    const lookup = await getSandboxRequestIosForProcessingSdk(
      client,
    ).GetSandboxRequestIosForProcessing({ id });
    const sandboxRequest = lookup.sandbox_access_request_ios_by_pk;

    if (!sandboxRequest) {
      return NextResponse.json({ success: true, changed: false });
    }

    processingStage = "app_store_connect";
    if (sandboxRequest.status === status) {
      // Re-applying the requested final state makes a retry repair any earlier
      // partial failure between Hasura and App Store Connect.
      await syncSandboxBetaTester(status, sandboxRequest.asc_email);
      return NextResponse.json({ success: true, changed: false });
    }

    if (!canTransition(sandboxRequest.status, status)) {
      return NextResponse.json(
        { error: "Unsupported status transition" },
        { status: 400 },
      );
    }

    await syncSandboxBetaTester(status, sandboxRequest.asc_email);

    processingStage = "status_update";
    const result = await getSdk(client).UpdateSandboxRequestIosStatus({
      id,
      from_status: sandboxRequest.status,
      status,
    });
    const update = result.update_sandbox_access_request_ios;

    if (update?.affected_rows === 0) {
      processingStage = "request_lookup";
      const concurrentLookup = await getSandboxRequestIosForProcessingSdk(
        client,
      ).GetSandboxRequestIosForProcessing({ id });
      const finalRequest = concurrentLookup.sandbox_access_request_ios_by_pk;

      if (!finalRequest || !isFinalStatus(finalRequest.status)) {
        throw new Error(
          "Concurrent iOS sandbox status update did not resolve to a final state",
        );
      }

      // A conflicting concurrent action may have changed TestFlight after our
      // first call. Re-apply the state that actually won the database race.
      processingStage = "app_store_connect";
      await syncSandboxBetaTester(finalRequest.status, finalRequest.asc_email);

      return NextResponse.json({ success: true, changed: false });
    }

    if (update?.affected_rows !== 1 || update.returning[0]?.status !== status) {
      throw new Error(
        "iOS sandbox status update did not return exactly one expected row",
      );
    }

    return NextResponse.json({ success: true, changed: true, status });
  } catch (error) {
    logger.error("Failed to update iOS sandbox request status", {
      requestId: id,
      requestedStatus: status,
      adminSubject: admin.subject,
      dependency:
        processingStage === "app_store_connect"
          ? "app_store_connect"
          : "hasura",
      processingStage,
      failureClass: error instanceof Error ? error.name : "UnknownError",
      error,
    });
    return NextResponse.json(
      { error: "Unable to update iOS sandbox request" },
      { status: 503 },
    );
  }
}
