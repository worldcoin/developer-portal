"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

type FinalStatus = "approved" | "rejected" | "revoked";
type ActionableStatus = "pending" | "approved";
type FailureStage =
  | "status_check"
  | "testflight_update"
  | "portal_status_update"
  | "status_recheck"
  | "testflight_reconciliation";

const FAILURE_STAGES = new Set<FailureStage>([
  "status_check",
  "testflight_update",
  "portal_status_update",
  "status_recheck",
  "testflight_reconciliation",
]);

const getFailureStage = (body: unknown): FailureStage | null => {
  if (!body || typeof body !== "object" || !("failureStage" in body)) {
    return null;
  }

  return typeof body.failureStage === "string" &&
    FAILURE_STAGES.has(body.failureStage as FailureStage)
    ? (body.failureStage as FailureStage)
    : null;
};

const getReturnedStatus = (body: unknown): FinalStatus | null | undefined => {
  if (!body || typeof body !== "object" || !("status" in body)) {
    return undefined;
  }

  return body.status === "approved" ||
    body.status === "rejected" ||
    body.status === "revoked"
    ? body.status
    : null;
};

const getActionName = (requestedStatus: FinalStatus) =>
  requestedStatus === "approved"
    ? "approval"
    : requestedStatus === "revoked"
      ? "revocation"
      : "rejection";

const getFailureMessage = (
  action: "approval" | "rejection" | "revocation",
  requestedStatus: FinalStatus,
  stage: FailureStage | null,
) => {
  switch (stage) {
    case "status_check":
      return `Couldn't check the current portal status before the ${action}. No change was attempted.`;
    case "testflight_update":
      return "App Store Connect enrollment failed. The approval was not saved.";
    case "portal_status_update":
      return requestedStatus === "approved"
        ? "TestFlight enrollment succeeded, but saving the approval in the portal failed. Retry to reconcile both systems."
        : `The portal status update failed before the ${action} reached TestFlight. No TestFlight change was made.`;
    case "status_recheck":
      return `TestFlight was updated, but the final portal status check failed during the ${action}. Refresh before retrying.`;
    case "testflight_reconciliation":
      return `TestFlight reconciliation failed during the ${action}. The portal status may already have changed; retry the action.`;
    default:
      return `The ${action} failed at an unknown stage. Refresh to check its current status before retrying.`;
  }
};

export const SandboxRequestIosActions = (props: {
  requestId: string;
  status: ActionableStatus;
}) => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<FinalStatus | null>(null);
  const [completed, setCompleted] = useState(false);

  const updateStatus = async (status: FinalStatus) => {
    if (submitting || completed) return;

    const action = getActionName(status);
    setSubmitting(status);
    try {
      const response = await fetch(
        `/api/admin/sandbox-requests-ios/${props.requestId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(getFailureMessage(action, status, getFailureStage(body)));
        return;
      }

      const returnedStatus = getReturnedStatus(body);
      if (returnedStatus === null) {
        toast.error(
          `The request no longer exists, so the ${action} was not applied.`,
        );
      } else if (returnedStatus && returnedStatus !== status) {
        toast.error(
          `The ${action} was superseded by another admin. The final status is ${returnedStatus}.`,
        );
      }

      setCompleted(true);
      router.refresh();
    } catch {
      toast.error(
        `Couldn't confirm the ${action}. Refresh to check its current status before retrying.`,
      );
    } finally {
      setSubmitting(null);
    }
  };

  if (props.status === "approved") {
    return (
      <DecoratedButton
        type="button"
        variant="danger"
        disabled={completed || submitting !== null}
        loading={submitting === "revoked"}
        onClick={() => void updateStatus("revoked")}
        className="h-8 w-20 px-3 py-1.5 text-12 whitespace-nowrap"
      >
        Revoke
      </DecoratedButton>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DecoratedButton
        type="button"
        variant="secondary"
        disabled={completed || submitting === "rejected"}
        loading={submitting === "approved"}
        onClick={() => void updateStatus("approved")}
        className="h-8 w-20 px-3 py-1.5 text-12 whitespace-nowrap"
      >
        Approve
      </DecoratedButton>
      <DecoratedButton
        type="button"
        variant="danger"
        disabled={completed || submitting === "approved"}
        loading={submitting === "rejected"}
        onClick={() => void updateStatus("rejected")}
        className="h-8 w-20 px-3 py-1.5 text-12 whitespace-nowrap"
      >
        Reject
      </DecoratedButton>
    </div>
  );
};
