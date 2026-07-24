"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

export const MarkInviteSentButton = (props: { requestId: string }) => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const markInviteSent = async () => {
    if (submitting || completed) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/sandbox-requests/${props.requestId}/accept`,
        { method: "POST" },
      );

      if (!response.ok) {
        toast.error("Couldn't mark the invite as sent. Please try again.");
        return;
      }

      setCompleted(true);
      router.refresh();
    } catch {
      toast.error("Couldn't mark the invite as sent. Please try again.");
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
      onClick={markInviteSent}
      className="h-8 px-3 py-1.5 text-12 whitespace-nowrap"
    >
      {completed ? "Invite sent" : "Mark invite sent"}
    </DecoratedButton>
  );
};
