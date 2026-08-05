"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export const ApproveSandboxRequestButton = (props: { requestId: string }) => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const approveRequest = async () => {
    if (submitting || completed) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/sandbox-requests/${props.requestId}/accept`,
        { method: "POST" },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        // Approval already stuck server-side; surface the email failure and
        // flip the button so the admin does not retry a no-op send.
        if (body?.error === "Unable to send sandbox invite email") {
          toast.error(
            "Approved, but the invite email failed. Follow up with the user.",
          );
          setCompleted(true);
          router.refresh();
          return;
        }

        toast.error("Couldn't approve the request. Please try again.");
        return;
      }

      setCompleted(true);
      router.refresh();
    } catch {
      toast.error("Couldn't approve the request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DecoratedButton
      type="button"
      variant="secondary"
      disabled={completed}
      loading={submitting}
      onClick={approveRequest}
      className="h-8 px-3 py-1.5 text-12 whitespace-nowrap"
    >
      {completed ? "Approved" : "Approve"}
    </DecoratedButton>
  );
};
