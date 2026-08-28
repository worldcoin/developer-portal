import {
  getSdk,
  type FetchReviewNotificationContextQuery,
} from "@/api/admin/reviewer/graphql/reviewer-workflow.generated";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import type { AdminUser } from "@/lib/admin-auth";
import { gql } from "graphql-request";
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

const beginSlackSubmissionDeliveryDocument = gql`
  mutation BeginSlackSubmissionDelivery(
    $notification_id: uuid!
    $worker_id: String!
    $fence_token: uuid!
  ) {
    reviewer_begin_app_review_submission_slack_delivery(
      args: {
        p_notification_id: $notification_id
        p_worker_id: $worker_id
        p_fence_token: $fence_token
      }
    ) {
      id
    }
  }
`;

export const beginSlackSubmissionDelivery = async ({
  notificationId,
  workerId,
  fenceToken,
}: {
  notificationId: string;
  workerId: string;
  fenceToken: string;
}) => {
  const client = await getAPIServiceGraphqlClient();
  const result = await client.request<{
    reviewer_begin_app_review_submission_slack_delivery: Array<{ id: string }>;
  }>(beginSlackSubmissionDeliveryDocument, {
    notification_id: notificationId,
    worker_id: workerId,
    fence_token: fenceToken,
  });
  return (
    result.reviewer_begin_app_review_submission_slack_delivery[0]?.id ===
    notificationId
  );
};

const reconcileReviewAssetCleanupDocument = gql`
  mutation ReconcilePreparedReviewAssetCleanup(
    $notification_id: uuid!
    $submission_id: uuid!
    $decision_fingerprint: String!
    $operation_id: String!
    $expected_review_version: Int!
    $app_metadata_id: String!
    $asset_keys: jsonb!
    $worker_id: String!
  ) {
    reviewer_reconcile_app_review_asset_cleanup(
      args: {
        p_notification_id: $notification_id
        p_submission_id: $submission_id
        p_decision_fingerprint: $decision_fingerprint
        p_operation_id: $operation_id
        p_expected_review_version: $expected_review_version
        p_app_metadata_id: $app_metadata_id
        p_asset_keys: $asset_keys
        p_worker_id: $worker_id
      }
    ) {
      id
      payload
    }
  }
`;

export type ReviewAssetCleanupSettlementState =
  | "pending"
  | "committed"
  | "aborted";

export const reconcilePreparedReviewAssetCleanup = async ({
  notificationId,
  submissionId,
  decisionFingerprint,
  operationId,
  expectedReviewVersion,
  appMetadataId,
  assetKeys,
  workerId,
}: {
  notificationId: string;
  submissionId: string;
  decisionFingerprint: string;
  operationId: string;
  expectedReviewVersion: number;
  appMetadataId: string;
  assetKeys: string[];
  workerId: string;
}): Promise<ReviewAssetCleanupSettlementState | null> => {
  const client = await getAPIServiceGraphqlClient();
  const result = await client.request<{
    reviewer_reconcile_app_review_asset_cleanup: Array<{
      id: string;
      payload: unknown;
    }>;
  }>(reconcileReviewAssetCleanupDocument, {
    notification_id: notificationId,
    submission_id: submissionId,
    decision_fingerprint: decisionFingerprint,
    operation_id: operationId,
    expected_review_version: expectedReviewVersion,
    app_metadata_id: appMetadataId,
    asset_keys: assetKeys,
    worker_id: workerId,
  });
  const payload =
    result.reviewer_reconcile_app_review_asset_cleanup[0]?.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const state = (payload as Record<string, unknown>).settlement_state;
  return state === "pending" || state === "committed" || state === "aborted"
    ? state
    : null;
};

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
  operationId,
  actor,
}: {
  notificationId: string;
  operationId: string;
  actor: AdminUser;
}) => {
  const result = await (
    await sdk()
  ).RetryReviewNotification({
    notification_id: notificationId,
    operation_id: operationId,
    actor_subject: actor.subject,
    actor_email: actor.email,
  });
  const row = result.reviewer_retry_app_review_notification[0];
  return row ? mapRetryNotification(row) : null;
};

const mapRetryNotification = (row: {
  id: unknown;
  status: string;
  attempt_count: number;
  next_attempt_at: string;
  delivered_at?: string | null;
}) => ({
  id: String(row.id),
  status: row.status,
  attemptCount: row.attempt_count,
  nextAttemptAt: row.next_attempt_at,
  deliveredAt: row.delivered_at ?? null,
});

export const reconcileRetryReviewNotification = async ({
  notificationId,
  operationId,
  actor,
}: {
  notificationId: string;
  operationId: string;
  actor: AdminUser;
}) => {
  const result = await (
    await sdk()
  ).FetchReviewNotificationRetryOutcome({
    notification_id: notificationId,
    actor_subject: actor.subject,
    event_payload: {
      notification_id: notificationId,
      operation_id: operationId,
    },
  });
  const notification = result.app_review_notification_by_pk;
  const event = result.app_review_event[0];
  return notification &&
    event &&
    String(event.submission_id) === String(notification.submission_id)
    ? mapRetryNotification(notification)
    : null;
};
