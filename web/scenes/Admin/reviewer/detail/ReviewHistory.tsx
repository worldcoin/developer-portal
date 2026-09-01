"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { getReviewEventLabel, sortReviewEvents } from "../history";
import type {
  ReviewerEvent,
  ReviewerNotification,
  ReviewerSubmissionDetail,
  ReviewerSubmissionStatus,
} from "../types";
import { ReviewerDateTime } from "./ReviewerTime";

const RETRY_OPERATION_STORAGE_PREFIX = "admin-reviewer-retry:";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const retryOperationStorageKey = (target: string) =>
  `${RETRY_OPERATION_STORAGE_PREFIX}${target}`;

const createRetryOperationId = () => {
  if (typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
};

const getRetryOperationId = (target: string) => {
  const storageKey = retryOperationStorageKey(target);
  try {
    const existing = window.sessionStorage.getItem(storageKey);
    if (existing && UUID_PATTERN.test(existing)) return existing;
  } catch {
    // Continue without persistence when storage is unavailable.
  }

  const operationId = createRetryOperationId();
  try {
    window.sessionStorage.setItem(storageKey, operationId);
  } catch {
    // The operation remains idempotent for the lifetime of this request.
  }
  return operationId;
};

const clearRetryOperationId = (target: string, operationId: string) => {
  try {
    const storageKey = retryOperationStorageKey(target);
    if (window.sessionStorage.getItem(storageKey) === operationId) {
      window.sessionStorage.removeItem(storageKey);
    }
  } catch {
    // Storage may be unavailable in a locked-down browser.
  }
};

const shouldClearRetryOperation = (response: Response) =>
  response.ok || (response.status >= 400 && response.status < 500);

export const ReviewHistory = ({
  assetSnapshotRepair,
  canReview,
  events,
  notifications,
  reviewId,
  reviewStatus,
}: {
  assetSnapshotRepair?: ReviewerSubmissionDetail["assetSnapshotRepair"];
  canReview: boolean;
  events: ReviewerEvent[];
  notifications: ReviewerNotification[];
  reviewId?: string;
  reviewStatus?: ReviewerSubmissionStatus;
}) => {
  const router = useRouter();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [queuedIds, setQueuedIds] = useState<Set<string>>(() => new Set());
  const [retryingAssets, setRetryingAssets] = useState(false);
  const [assetsQueued, setAssetsQueued] = useState(false);

  const retry = async (notification: ReviewerNotification) => {
    const target = `notification:${notification.id}`;
    const operationId = getRetryOperationId(target);
    setRetryingId(notification.id);
    try {
      const response = await fetch(
        `/api/admin/reviewer/notifications/${notification.id}/retry`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationId }),
        },
      );
      if (shouldClearRetryOperation(response)) {
        clearRetryOperationId(target, operationId);
      }
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

  const retryAssets = async () => {
    if (!reviewId) return;
    const target = `assets:${reviewId}`;
    const operationId = getRetryOperationId(target);
    setRetryingAssets(true);
    try {
      const response = await fetch(
        `/api/admin/reviewer/submissions/${reviewId}/assets/retry`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationId }),
        },
      );
      if (shouldClearRetryOperation(response)) {
        clearRetryOperationId(target, operationId);
      }
      if (!response.ok) throw new Error();
      setAssetsQueued(true);
      toast.success("Submitted assets queued for preparation");
      router.refresh();
    } catch {
      toast.error("Could not retry submitted asset preparation");
    } finally {
      setRetryingAssets(false);
    }
  };

  const activeReview =
    reviewStatus === "pending" || reviewStatus === "in_review";

  return (
    <div className="grid gap-5">
      {assetSnapshotRepair && !assetSnapshotRepair.ready ? (
        <section className="rounded-12 border border-system-warning-200 bg-system-warning-100 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-14 font-semibold text-grey-900">
                Submitted asset preparation
              </h2>
              <p className="text-grey-600 mt-1 text-12 leading-5">
                {assetsQueued
                  ? "Retry queued. The worker will prepare the immutable review assets shortly."
                  : assetSnapshotRepair.deadLetteredAt
                    ? `Stopped after ${assetSnapshotRepair.attemptCount} attempts. Approval is blocked until the assets are prepared.`
                    : activeReview
                      ? "The immutable review assets are still being prepared. Approval remains blocked."
                      : "This historical attempt did not receive an immutable asset snapshot."}
              </p>
              {assetSnapshotRepair.lastError ? (
                <p className="mt-2 text-11 text-system-error-700">
                  {assetSnapshotRepair.lastError}
                </p>
              ) : null}
              {!assetSnapshotRepair.deadLetteredAt &&
              assetSnapshotRepair.nextAttemptAt ? (
                <p className="mt-2 text-11 text-grey-500">
                  Next retry:{" "}
                  <ReviewerDateTime value={assetSnapshotRepair.nextAttemptAt} />
                </p>
              ) : null}
            </div>
            {activeReview &&
            assetSnapshotRepair.deadLetteredAt &&
            !assetsQueued ? (
              <button
                className="min-h-11 rounded-8 border border-grey-300 bg-grey-0 px-3 py-2 text-11 font-semibold text-grey-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canReview || retryingAssets}
                onClick={retryAssets}
                type="button"
              >
                Retry submitted assets
              </button>
            ) : null}
          </div>
        </section>
      ) : null}

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
                <ReviewerDateTime
                  className="text-11 text-grey-400"
                  value={event.createdAt}
                />
              </div>
              <p className="mt-1 text-12 text-grey-500">
                {event.actorEmail ?? event.actorSubject ?? "System"}
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
                        Last attempt:{" "}
                        <ReviewerDateTime value={notification.lastAttemptAt} />
                      </p>
                    ) : null}
                    {(notification.status === "failed" ||
                      notification.status === "pending") &&
                    notification.nextAttemptAt ? (
                      <p className="mt-1 text-11 text-grey-500">
                        Next retry:{" "}
                        <ReviewerDateTime value={notification.nextAttemptAt} />
                      </p>
                    ) : null}
                    {notification.deliveredAt ? (
                      <p className="mt-1 text-11 text-grey-500">
                        Delivered:{" "}
                        <ReviewerDateTime value={notification.deliveredAt} />
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
                  notification.retryable !== false &&
                  !queuedIds.has(notification.id) ? (
                    <button
                      className="min-h-11 rounded-8 border border-grey-300 bg-grey-0 px-3 py-2 text-11 font-semibold text-grey-700 disabled:cursor-not-allowed disabled:opacity-50"
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
