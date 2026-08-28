"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { getReviewEventLabel, sortReviewEvents } from "../history";
import type { ReviewerEvent, ReviewerNotification } from "../types";

const formatTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export const ReviewHistory = ({
  canReview,
  events,
  notifications,
}: {
  canReview: boolean;
  events: ReviewerEvent[];
  notifications: ReviewerNotification[];
}) => {
  const router = useRouter();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [queuedIds, setQueuedIds] = useState<Set<string>>(() => new Set());

  const retry = async (notification: ReviewerNotification) => {
    setRetryingId(notification.id);
    try {
      const response = await fetch(
        `/api/admin/reviewer/notifications/${notification.id}/retry`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        },
      );
      if (!response.ok) throw new Error();
      setQueuedIds((current) => new Set(current).add(notification.id));
      toast.success("Notification queued for retry");
      router.refresh();
    } catch {
      toast.error("Could not retry the notification");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="grid gap-5">
      <section className="rounded-12 border border-grey-200 bg-grey-0 p-5">
        <h2 className="text-16 font-semibold text-grey-900">
          Immutable review timeline
        </h2>
        <ol className="mt-4 grid gap-3">
          {sortReviewEvents(events).map((event) => (
            <li
              className="relative border-l border-grey-200 py-1 pl-5"
              data-review-event
              key={event.id}
            >
              <span className="absolute top-2 -left-1.5 size-3 rounded-full border-2 border-grey-0 bg-grey-400" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-13 font-semibold text-grey-900">
                  {getReviewEventLabel(event.eventType)}
                </h3>
                <time
                  className="text-11 text-grey-400"
                  dateTime={event.createdAt}
                >
                  {formatTime(event.createdAt)}
                </time>
              </div>
              <p className="mt-1 text-12 text-grey-500">
                {event.actorEmail ?? "System"}
                {event.reviewVersion ? ` · version ${event.reviewVersion}` : ""}
              </p>
              {Object.keys(event.payload).length ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-11 font-medium text-blue-500">
                    Event details
                  </summary>
                  <pre className="mt-2 overflow-auto rounded-8 bg-grey-50 p-3 text-11 text-grey-700">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </details>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <details className="rounded-12 border border-grey-200 bg-grey-0 p-5">
        <summary className="cursor-pointer text-14 font-semibold text-grey-900">
          Delivery attempts
        </summary>
        <div className="mt-4 grid gap-3">
          {notifications.length ? (
            notifications.map((notification) => (
              <article
                className="rounded-8 border border-grey-200 bg-grey-50 p-3"
                key={notification.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-13 font-semibold text-grey-900">
                      {notification.channel.toUpperCase()} ·{" "}
                      {queuedIds.has(notification.id)
                        ? "pending"
                        : notification.status}
                    </p>
                    <p className="mt-1 text-11 text-grey-500">
                      {notification.notificationType} ·{" "}
                      {notification.attemptCount} attempts
                    </p>
                    {notification.recipient ? (
                      <p className="mt-1 text-11 text-grey-500">
                        {notification.recipient}
                      </p>
                    ) : null}
                    {notification.lastAttemptAt ? (
                      <p className="mt-1 text-11 text-grey-500">
                        Last attempt: {formatTime(notification.lastAttemptAt)}
                      </p>
                    ) : null}
                    {(notification.status === "failed" ||
                      notification.status === "pending") &&
                    notification.nextAttemptAt ? (
                      <p className="mt-1 text-11 text-grey-500">
                        Next retry: {formatTime(notification.nextAttemptAt)}
                      </p>
                    ) : null}
                    {notification.deliveredAt ? (
                      <p className="mt-1 text-11 text-grey-500">
                        Delivered: {formatTime(notification.deliveredAt)}
                      </p>
                    ) : null}
                    {notification.providerMessageId ? (
                      <p className="mt-1 text-11 break-all text-grey-500">
                        Provider ID: {notification.providerMessageId}
                      </p>
                    ) : null}
                  </div>
                  {(notification.status === "failed" ||
                    notification.status === "dead_letter") &&
                  !queuedIds.has(notification.id) ? (
                    <button
                      className="rounded-8 border border-grey-300 bg-grey-0 px-3 py-2 text-11 font-semibold text-grey-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!canReview || retryingId === notification.id}
                      onClick={() => retry(notification)}
                      type="button"
                    >
                      Retry {notification.channel} notification
                    </button>
                  ) : null}
                </div>
                {notification.lastError ? (
                  <p className="mt-3 rounded-8 bg-system-error-100 p-2 text-11 text-system-error-700">
                    {notification.lastError}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <p className="text-13 text-grey-500">No delivery records yet.</p>
          )}
        </div>
      </details>
    </div>
  );
};
