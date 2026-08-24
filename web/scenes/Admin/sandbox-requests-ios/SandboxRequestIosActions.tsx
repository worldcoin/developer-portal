"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

type RequestedStatus = "approved" | "rejected" | "revoked";
type ReturnedStatus = "pending" | RequestedStatus | "revoking";
type ActionableStatus = "pending" | "approved" | "revoking";
const FAILURE_STAGES = [
  "status_check",
  "testflight_update",
  "portal_status_update",
  "revocation_lock",
  "revocation_finalize",
  "status_recheck",
  "testflight_reconciliation",
  "revocation_rollback",
] as const;
type FailureStage = (typeof FAILURE_STAGES)[number];

const readField = (body: unknown, field: string) =>
  body && typeof body === "object" && field in body
    ? body[field as keyof typeof body]
    : undefined;

const getFailureStage = (body: unknown) => {
  const stage = readField(body, "failureStage");
  return typeof stage === "string" &&
    FAILURE_STAGES.includes(stage as FailureStage)
    ? (stage as FailureStage)
    : null;
};

const getReturnedStatus = (
  body: unknown,
): ReturnedStatus | null | undefined => {
  const status = readField(body, "status");
  if (status === null) return null;
  return status === "pending" ||
    status === "approved" ||
    status === "rejected" ||
    status === "revoking" ||
    status === "revoked"
    ? status
    : undefined;
};

const getActionName = (status: RequestedStatus) =>
  status === "approved"
    ? "approval"
    : status === "revoked"
      ? "revocation"
      : "rejection";

const getFailureMessage = (
  status: RequestedStatus,
  stage: FailureStage | null,
) => {
  const action = getActionName(status);
  switch (stage) {
    case "status_check":
      return `Couldn't check the portal before the ${action}. Nothing was changed.`;
    case "testflight_update":
      return status === "revoked"
        ? "App Store Connect removal failed. Access still appears approved; retry the revocation."
        : "App Store Connect enrollment failed. The approval was not saved.";
    case "portal_status_update":
      return status === "approved"
        ? "TestFlight enrollment succeeded, but the portal approval failed. Retry to reconcile both systems."
        : "The rejection could not be saved. No App Store Connect change was attempted.";
    case "revocation_lock":
      return "The portal could not start the revocation. App Store Connect was not changed.";
    case "revocation_finalize":
      return "App Store Connect removal succeeded, but the portal could not finalize it. Retry the revocation.";
    case "revocation_rollback":
      return "App Store Connect removal failed and the portal could not release its retry lock. Retry the revocation.";
    case "status_recheck":
      return `The ${action} ran, but its final portal status could not be confirmed. Refresh before retrying.`;
    case "testflight_reconciliation":
      return `App Store Connect reconciliation failed during the ${action}. Refresh and retry.`;
    default:
      return `The ${action} failed at an unknown stage. Refresh before retrying.`;
  }
};

export const SandboxRequestIosActions = (props: {
  requestId: string;
  status: ActionableStatus;
}) => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<RequestedStatus | null>(null);
  const [completed, setCompleted] = useState(false);
  const [showRejectionReason, setShowRejectionReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const updateStatus = async (status: RequestedStatus) => {
    if (submitting || completed) return;

    const action = getActionName(status);
    setSubmitting(status);
    try {
      const response = await fetch(
        `/api/admin/sandbox-requests-ios/${props.requestId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            ...(status === "rejected" ? { reason: rejectionReason } : {}),
          }),
        },
      );
      const body: unknown = await response.json().catch(() => null);
      const returnedStatus = getReturnedStatus(body);

      if (!response.ok) {
        toast.error(getFailureMessage(status, getFailureStage(body)));
        if (returnedStatus === "revoking") router.refresh();
        return;
      }

      if (returnedStatus === null) {
        toast.error(
          `The request no longer exists, so the ${action} was not applied.`,
        );
      } else if (returnedStatus && returnedStatus !== status) {
        toast.error(
          `The ${action} was superseded. The current status is ${returnedStatus}.`,
        );
      }

      setCompleted(true);
      router.refresh();
    } catch {
      toast.error(`Couldn't confirm the ${action}. Refresh before retrying.`);
      router.refresh();
    } finally {
      setSubmitting(null);
    }
  };

  const buttonClassName =
    "h-8 w-20 px-3 py-1.5 text-12 whitespace-nowrap active:translate-y-px";

  if (props.status === "approved" || props.status === "revoking") {
    return (
      <DecoratedButton
        type="button"
        variant="danger"
        disabled={completed || submitting !== null}
        loading={submitting === "revoked"}
        onClick={() => void updateStatus("revoked")}
        className={buttonClassName}
      >
        {props.status === "revoking" ? "Retry" : "Revoke"}
      </DecoratedButton>
    );
  }

  if (showRejectionReason) {
    return (
      <div className="grid min-w-64 gap-2">
        <textarea
          autoFocus
          aria-label="Rejection reason"
          placeholder="Reason (optional)"
          maxLength={500}
          rows={2}
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          className="resize-none rounded-8 border border-grey-200 bg-white px-2 py-1.5 text-12 text-grey-900 outline-hidden focus:ring-2 focus:ring-grey-300"
        />
        <div className="flex gap-2">
          <DecoratedButton
            type="button"
            variant="danger"
            disabled={completed || submitting !== null}
            loading={submitting === "rejected"}
            onClick={() => void updateStatus("rejected")}
            className={buttonClassName}
          >
            Confirm
          </DecoratedButton>
          <DecoratedButton
            type="button"
            variant="secondary"
            disabled={submitting !== null}
            onClick={() => setShowRejectionReason(false)}
            className={buttonClassName}
          >
            Cancel
          </DecoratedButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DecoratedButton
        type="button"
        variant="secondary"
        disabled={completed || submitting !== null}
        loading={submitting === "approved"}
        onClick={() => void updateStatus("approved")}
        className={buttonClassName}
      >
        Approve
      </DecoratedButton>
      <DecoratedButton
        type="button"
        variant="danger"
        disabled={completed || submitting !== null}
        onClick={() => setShowRejectionReason(true)}
        className={buttonClassName}
      >
        Reject
      </DecoratedButton>
    </div>
  );
};
