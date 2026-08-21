"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

type FinalStatus = "approved" | "rejected";

export const SandboxRequestIosActions = (props: { requestId: string }) => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<FinalStatus | null>(null);
  const [completed, setCompleted] = useState(false);

  const updateStatus = async (status: FinalStatus) => {
    if (submitting || completed) return;

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

      if (!response.ok) {
        toast.error("Couldn't update the request. Please try again.");
        return;
      }

      setCompleted(true);
      router.refresh();
    } catch {
      toast.error("Couldn't update the request. Please try again.");
    } finally {
      setSubmitting(null);
    }
  };

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
