import {
  addSandboxBetaTester,
  removeSandboxBetaTester,
} from "@/api/helpers/app-store-connect/beta-tester-handler";
import { getInternalDashboardGraphqlClientForUser } from "@/api/helpers/graphql";
import { authenticateAdminRequest } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getRequestSdk } from "./graphql/get-sandbox-request-ios-for-processing.generated";
import { getSdk as getStatusSdk } from "./graphql/update-sandbox-request-ios-status.generated";

const REQUEST_ID_PATTERN = /^sbx_req_[a-zA-Z0-9]+$/;
const MAX_REJECTION_REASON_LENGTH = 500;
const REVOCATION_LOCK_KEY_PREFIX = "sandbox_access_request_ios:revoking:";
// Must outlive the slowest legitimate revocation, or a second caller could
// acquire the lease while the first is still talking to Apple. Worst case is
// ~186s: an App Store Connect removal of ~64s (two idempotent calls, three 10s
// attempts each plus backoff) between Hasura round trips that cost up to 15s
// per mutation and 45s per retried query. 240s clears that with margin; the
// only cost of the margin is that a caller which dies mid-revocation delays
// the resuming retry by that much.
const REVOCATION_LOCK_TTL_MS = 240_000;

// Release only our own lease: if the TTL elapsed and another caller took over,
// a blind DEL would drop that caller's lock instead.
const RELEASE_LOCK_SCRIPT = `if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0`;

type RequestedStatus = "approved" | "rejected" | "revoked";
type StoredStatus = "pending" | "approving" | RequestedStatus | "revoking";
type ProcessingStage =
  | "status_check"
  | "approval_claim"
  | "approval_finalize"
  | "rejection_update"
  | "revocation_claim"
  | "testflight_update"
  | "revocation_finalize";

type StatusCommand = {
  status: RequestedStatus;
  rejectionReason: string | null;
};

type RevocationLock =
  | { status: "acquired"; owner: string }
  | { status: "busy" }
  | { status: "unavailable"; error?: unknown };

/**
 * Serializes revocations of one request so only a single caller ever drives the
 * App Store Connect removal.
 *
 * Rejecting or revoking a request releases its Apple Account for re-enrollment,
 * so a duplicate in-flight revocation is no longer harmless: it can finish its
 * removal after the address was released, re-claimed and re-approved, and strip
 * the new owner's TestFlight access while the row still reads `approved`.
 *
 * The lease expires on its own, so a caller that dies mid-revocation still
 * leaves the row resumable instead of stranding it in `revoking` — which would
 * reserve the address forever, the very defect this flow now avoids.
 *
 * Without the lease the removal is not safe to run, so an unreachable Redis
 * fails the request closed (503) rather than proceeding unserialized. The row
 * keeps its current status and the caller can retry; nothing is lost.
 */
const acquireRevocationLock = async (id: string): Promise<RevocationLock> => {
  const redis = global.RedisClient;
  if (!redis) return { status: "unavailable" };

  const owner = randomUUID();
  try {
    const claimed = await redis.set(
      `${REVOCATION_LOCK_KEY_PREFIX}${id}`,
      owner,
      "PX",
      REVOCATION_LOCK_TTL_MS,
      "NX",
    );
    return claimed === "OK"
      ? { status: "acquired", owner }
      : { status: "busy" };
  } catch (error) {
    return { status: "unavailable", error };
  }
};

const releaseRevocationLock = async (id: string, owner: string) => {
  const redis = global.RedisClient;
  if (!redis) return;

  try {
    await redis.eval(
      RELEASE_LOCK_SCRIPT,
      1,
      `${REVOCATION_LOCK_KEY_PREFIX}${id}`,
      owner,
    );
  } catch (error) {
    // The TTL still frees it; a retry is only delayed, never lost.
    logger.warn("Failed to release iOS sandbox revocation lock", {
      requestId: id,
      dependency: "redis",
      failureClass: "revocation_lock_release_failed",
      error,
    });
  }
};

const isStoredStatus = (value: unknown): value is StoredStatus =>
  value === "pending" ||
  value === "approving" ||
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

  if (rejectionReason.length > MAX_REJECTION_REASON_LENGTH) return null;

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
  let knownStatus: StoredStatus | null | undefined;

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
      knownStatus = request?.status ?? null;
      return request ?? null;
    };

    const transition = async (
      from: StoredStatus,
      set: Record<string, string | null> & { status: StoredStatus },
    ) => {
      const data = await statusSdk.TransitionSandboxRequestIosStatus({
        id,
        from,
        set,
      });
      const update = data.update_sandbox_access_request_ios;
      if (!update) {
        throw new Error("iOS sandbox status transition returned no result");
      }
      if (update.affected_rows === 0) return null;
      if (update.affected_rows !== 1 || update.returning.length !== 1) {
        throw new Error(
          `iOS sandbox status transition affected ${update.affected_rows} rows`,
        );
      }

      const request = update.returning[0];
      if (!isStoredStatus(request.status)) {
        throw new Error(`Unexpected iOS sandbox status: ${request.status}`);
      }
      knownStatus = request.status;
      return request;
    };

    const respond = (changed: boolean, status: StoredStatus | null) =>
      NextResponse.json({ success: true, changed, status });

    const unsupportedTransition = (status: StoredStatus) =>
      NextResponse.json(
        { error: "Unsupported status transition", status },
        { status: 409 },
      );

    if (command.status === "rejected") {
      processingStage = "rejection_update";
      const rejected = await transition("pending", {
        status: "rejected",
        rejection_reason: command.rejectionReason,
      });
      if (rejected) return respond(true, "rejected");

      processingStage = "status_check";
      const current = await readRequest();
      if (!current) return respond(false, null);
      return current.status === "rejected"
        ? respond(false, "rejected")
        : unsupportedTransition(current.status);
    }

    if (command.status === "approved") {
      processingStage = "approval_claim";
      let approval = await transition("pending", { status: "approving" });

      if (!approval) {
        processingStage = "status_check";
        const current = await readRequest();
        if (!current) return respond(false, null);
        if (current.status === "approved") {
          return respond(false, "approved");
        }
        if (current.status !== "approving") {
          return unsupportedTransition(current.status);
        }
        approval = current;
      }

      processingStage = "testflight_update";
      await addSandboxBetaTester(approval.asc_email);

      processingStage = "approval_finalize";
      const approved = await transition("approving", {
        status: "approved",
        approved_at: new Date().toISOString(),
      });
      if (approved) return respond(true, "approved");

      processingStage = "status_check";
      const current = await readRequest();
      if (current?.status === "approved") {
        return respond(false, "approved");
      }
      throw new Error("iOS sandbox approval changed before finalization");
    }

    const revocationLock = await acquireRevocationLock(id);
    if (revocationLock.status === "busy") {
      logger.warn("iOS sandbox revocation is already in progress", {
        requestId: id,
        adminSubject: admin.subject,
        failureClass: "revocation_in_progress",
      });
      return NextResponse.json(
        { error: "Revocation already in progress" },
        { status: 409 },
      );
    }
    if (revocationLock.status === "unavailable") {
      logger.error("Redis unavailable for iOS sandbox revocation lock", {
        requestId: id,
        adminSubject: admin.subject,
        dependency: "redis",
        failureClass: "revocation_lock_unavailable",
        error: revocationLock.error,
      });
      return NextResponse.json(
        { error: "Unable to update iOS sandbox request" },
        { status: 503 },
      );
    }

    try {
      processingStage = "revocation_claim";
      let revocation = await transition("approved", { status: "revoking" });

      if (!revocation) {
        processingStage = "status_check";
        const current = await readRequest();
        if (!current) return respond(false, null);
        if (current.status === "revoked") return respond(false, "revoked");
        if (current.status !== "revoking") {
          return unsupportedTransition(current.status);
        }
        revocation = current;
      }

      processingStage = "testflight_update";
      await removeSandboxBetaTester(revocation.asc_email);

      processingStage = "revocation_finalize";
      const revoked = await transition("revoking", {
        status: "revoked",
        revoked_at: new Date().toISOString(),
      });
      if (revoked) return respond(true, "revoked");

      processingStage = "status_check";
      const current = await readRequest();
      if (current?.status === "revoked") return respond(false, "revoked");
      throw new Error("iOS sandbox revocation changed before finalization");
    } finally {
      await releaseRevocationLock(id, revocationLock.owner);
    }
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
        ...(knownStatus !== undefined ? { status: knownStatus } : {}),
      },
      { status: 503 },
    );
  }
}
