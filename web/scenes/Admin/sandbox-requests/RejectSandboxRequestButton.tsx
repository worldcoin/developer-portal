"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const EMAIL_SENT_DELETE_FAILED = "REJECTION_EMAIL_SENT_DELETE_FAILED";

export const RejectSandboxRequestButton = (props: { requestId: string }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const reasonId = `reject-sandbox-request-${props.requestId}-reason`;

  const rejectRequest = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason || submitting || completed) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/admin/sandbox-requests/${props.requestId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: trimmedReason }),
        },
      );

      if (!response.ok) {
        const result: unknown = await response.json().catch(() => null);
        if (
          result &&
          typeof result === "object" &&
          "code" in result &&
          result.code === EMAIL_SENT_DELETE_FAILED
        ) {
          setCompleted(true);
          setOpen(false);
          toast.error(
            "Rejection email was sent, but the request couldn't be removed. Don't retry; contact support.",
          );
          return;
        }

        toast.error("Couldn't reject the request. Please try again.");
        return;
      }

      setCompleted(true);
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Couldn't reject the request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        disabled={submitting || completed}
        className="relative flex h-8 w-20 items-center justify-center rounded-[100px] border border-system-error-400 bg-grey-0 px-3 py-1.5 font-gta text-12 font-medium whitespace-nowrap text-system-error-600 hover:bg-system-error-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:pointer-events-none disabled:border-system-error-200 disabled:text-system-error-300"
      >
        Reject
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        className="w-72 max-w-[calc(100vw-1.5rem)] gap-2 rounded-12 border border-grey-200 bg-grey-0 p-3 shadow-lg"
      >
        <form
          className="grid min-w-0 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void rejectRequest();
          }}
        >
          <label
            htmlFor={reasonId}
            className="text-12 font-medium text-grey-700"
          >
            Reason for rejection? (Required)
          </label>
          <textarea
            id={reasonId}
            value={reason}
            rows={3}
            autoFocus
            required
            disabled={submitting || completed}
            onChange={(event) => setReason(event.target.value)}
            className="w-full min-w-0 resize-y rounded-8 border border-grey-200 bg-grey-0 px-3 py-2 text-13 text-grey-700 outline-hidden placeholder:text-grey-400 focus:border-blue-500 disabled:bg-grey-50 disabled:text-grey-400"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!reason.trim() || submitting || completed}
              aria-busy={submitting}
              className="inline-flex h-8 w-20 items-center justify-center rounded-[100px] border border-system-error-500 bg-system-error-500 px-3 py-1.5 font-gta text-12 font-medium whitespace-nowrap text-white shadow-button hover:border-system-error-600 hover:bg-system-error-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:border-system-error-500 disabled:bg-system-error-500 disabled:text-white"
            >
              {submitting ? "Rejecting" : "Reject"}
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};
