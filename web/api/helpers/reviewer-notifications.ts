import {
  getSdk,
  type FetchReviewNotificationContextQuery,
} from "@/api/admin/reviewer/graphql/reviewer-workflow.generated";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import type { AdminUser } from "@/lib/admin-auth";
import "server-only";

type ClaimedRow = {
  id: unknown;
  submission_id: unknown;
  notification_type: string;
  channel: string;
  status: string;
  recipient?: string | null;
  payload: unknown;
  attempt_count: number;
  locked_at?: string | null;
  locked_by?: string | null;
};

export type ClaimedReviewNotification = {
  id: string;
  submissionId: string;
  notificationType: string;
  channel: string;
  status: string;
  recipient: string | null;
  payload: unknown;
  attemptCount: number;
  lockedAt: string | null;
  lockedBy: string | null;
};

const mapNotification = (row: ClaimedRow): ClaimedReviewNotification => ({
  id: String(row.id),
  submissionId: String(row.submission_id),
  notificationType: row.notification_type,
  channel: row.channel,
  status: row.status,
  recipient: row.recipient ?? null,
  payload: row.payload,
  attemptCount: row.attempt_count,
  lockedAt: row.locked_at ?? null,
  lockedBy: row.locked_by ?? null,
});

const sdk = async () => getSdk(await getAPIServiceGraphqlClient());

export const claimReviewNotifications = async ({
  workerId,
  limit,
}: {
  workerId: string;
  limit: number;
}) => {
  const result = await (
    await sdk()
  ).ClaimReviewNotifications({ worker_id: workerId, limit });
  return result.reviewer_claim_app_review_notifications.map(mapNotification);
};

type ContextRow = NonNullable<
  FetchReviewNotificationContextQuery["app_review_notification_by_pk"]
>;

export type ReviewNotificationContext = {
  notification: ClaimedReviewNotification;
  submission: {
    id: string;
    appId: string;
    appMetadataId: string;
    appMode: "mini-app" | "external";
    listingTarget: "mini_app_store" | "world_ecosystem";
    status: string;
    reviewVersion: number;
    decisionFingerprint: string | null;
    decisionResult: unknown;
    changelog: string;
    submittedAt: string;
    decisionSummary: string | null;
    metadataSnapshot: unknown;
    appName: string;
    teamName: string;
    teamId: string;
    claimExpiresAt: string | null;
  };
};

const mapContext = (row: ContextRow): ReviewNotificationContext | null => {
  const submission = row.submission;
  if (
    (submission.app_mode !== "mini-app" &&
      submission.app_mode !== "external") ||
    (submission.listing_target !== "mini_app_store" &&
      submission.listing_target !== "world_ecosystem")
  ) {
    return null;
  }
  return {
    notification: mapNotification(row),
    submission: {
      id: String(submission.id),
      appId: submission.app_id,
      appMetadataId: submission.app_metadata_id,
      appMode: submission.app_mode,
      listingTarget: submission.listing_target,
      status: submission.status,
      reviewVersion: submission.review_version,
      decisionFingerprint: submission.decision_fingerprint ?? null,
      decisionResult: submission.decision_result,
      changelog: submission.changelog,
      submittedAt: submission.submitted_at,
      decisionSummary: submission.decision_summary ?? null,
      metadataSnapshot: submission.metadata_snapshot,
      appName: submission.app.name,
      teamName: submission.team.name ?? "Unnamed team",
      teamId: submission.team_id,
      claimExpiresAt: submission.claim_expires_at ?? null,
    },
  };
};

export const fetchReviewNotificationContext = async (
  notificationId: string,
) => {
  const result = await (
    await sdk()
  ).FetchReviewNotificationContext({ notification_id: notificationId });
  const row = result.app_review_notification_by_pk;
  return row ? mapContext(row) : null;
};

export const completeReviewNotification = async ({
  notificationId,
  workerId,
  outcome,
  providerMessageId,
  error,
}: {
  notificationId: string;
  workerId: string;
  outcome: "delivered" | "failed" | "deferred";
  providerMessageId: string | null;
  error: string | null;
}) => {
  const result = await (
    await sdk()
  ).CompleteReviewNotification({
    notification_id: notificationId,
    worker_id: workerId,
    outcome,
    provider_message_id: providerMessageId,
    error,
  });
  const row = result.reviewer_complete_app_review_notification[0];
  return row
    ? {
        id: String(row.id),
        status: row.status,
        attemptCount: row.attempt_count,
        nextAttemptAt: row.next_attempt_at,
        deliveredAt: row.delivered_at ?? null,
      }
    : null;
};

export const retryReviewNotification = async ({
  notificationId,
  actor,
}: {
  notificationId: string;
  actor: AdminUser;
}) => {
  const result = await (
    await sdk()
  ).RetryReviewNotification({
    notification_id: notificationId,
    actor_subject: actor.subject,
    actor_email: actor.email,
  });
  const row = result.reviewer_retry_app_review_notification[0];
  return row
    ? {
        id: String(row.id),
        status: row.status,
        attemptCount: row.attempt_count,
        nextAttemptAt: row.next_attempt_at,
        deliveredAt: row.delivered_at ?? null,
      }
    : null;
};
