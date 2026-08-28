import "server-only";

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  snapshotReviewerSubmissionAssets,
  tryDeleteReviewerSubmissionAssetSnapshot,
  type ReviewerSubmissionAssetSnapshot,
} from "@/api/helpers/reviewer-submission-assets";
import { gql } from "graphql-request";
import type { AdminUser } from "@/lib/admin-auth";
import { randomUUID } from "node:crypto";

type RepairCandidate = {
  id: string;
  app_id: string;
  app_metadata_id: string;
  review_version: number;
  asset_snapshot_repair_attempt_count: number;
  metadata_snapshot: Record<string, unknown>;
  localizations_snapshot: Array<Record<string, unknown>>;
};

const FetchMissingReviewerAssetSnapshots = gql`
  query FetchMissingReviewerAssetSnapshots($limit: Int!, $now: timestamptz!) {
    app_review_submission(
      limit: $limit
      order_by: [{ submitted_at: asc }, { id: asc }]
      where: {
        asset_snapshot: { _is_null: true }
        asset_snapshot_repair_dead_lettered_at: { _is_null: true }
        status: { _in: ["pending", "in_review"] }
        _or: [
          { asset_snapshot_repair_next_at: { _is_null: true } }
          { asset_snapshot_repair_next_at: { _lte: $now } }
        ]
      }
    ) {
      id
      app_id
      app_metadata_id
      review_version
      asset_snapshot_repair_attempt_count
      metadata_snapshot
      localizations_snapshot
    }
  }
`;

const FailReviewerAssetSnapshotRepair = gql`
  mutation FailReviewerAssetSnapshotRepair(
    $submission_id: uuid!
    $expected_review_version: Int!
    $expected_attempt_count: Int!
    $error: String!
  ) {
    reviewer_fail_app_review_asset_snapshot_repair(
      args: {
        p_submission_id: $submission_id
        p_expected_review_version: $expected_review_version
        p_expected_attempt_count: $expected_attempt_count
        p_error: $error
      }
    ) {
      id
      asset_snapshot_repair_attempt_count
      asset_snapshot_repair_dead_lettered_at
    }
  }
`;

const BeginReviewerAssetSnapshotRepair = gql`
  mutation BeginReviewerAssetSnapshotRepair(
    $submission_id: uuid!
    $expected_review_version: Int!
    $expected_attempt_count: Int!
    $operation_id: uuid!
  ) {
    reviewer_begin_app_review_asset_snapshot_repair(
      args: {
        p_submission_id: $submission_id
        p_expected_review_version: $expected_review_version
        p_expected_attempt_count: $expected_attempt_count
        p_operation_id: $operation_id
      }
    ) {
      id
    }
  }
`;

const SetReviewerAssetSnapshot = gql`
  mutation SetReviewerAssetSnapshot(
    $submission_id: uuid!
    $expected_review_version: Int!
    $asset_snapshot: jsonb!
  ) {
    reviewer_set_app_review_asset_snapshot(
      args: {
        p_submission_id: $submission_id
        p_expected_review_version: $expected_review_version
        p_asset_snapshot: $asset_snapshot
      }
    ) {
      id
    }
  }
`;

const ReconcileReviewerAssetSnapshotRepairOutcome = gql`
  mutation ReconcileReviewerAssetSnapshotRepairOutcome(
    $submission_id: uuid!
    $asset_snapshot: jsonb!
  ) {
    reconcile_app_review_asset_snapshot_repair(
      args: {
        p_submission_id: $submission_id
        p_asset_snapshot: $asset_snapshot
      }
    ) {
      id
    }
  }
`;

const RetryReviewerAssetSnapshotRepair = gql`
  mutation RetryReviewerAssetSnapshotRepair(
    $submission_id: uuid!
    $operation_id: uuid!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_retry_app_review_asset_snapshot_repair(
      args: {
        p_submission_id: $submission_id
        p_operation_id: $operation_id
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      asset_snapshot_repair_attempt_count
      asset_snapshot_repair_next_at
      asset_snapshot_repair_last_error
      asset_snapshot_repair_dead_lettered_at
    }
  }
`;

const FindReviewerAssetSnapshotRepairRetryOutcome = gql`
  query FindReviewerAssetSnapshotRepairRetryOutcome(
    $submission_id: uuid!
    $actor_subject: String!
    $event_payload: jsonb!
  ) {
    app_review_submission_by_pk(id: $submission_id) {
      id
      asset_snapshot_repair_attempt_count
      asset_snapshot_repair_next_at
      asset_snapshot_repair_last_error
      asset_snapshot_repair_dead_lettered_at
    }
    app_review_event(
      limit: 1
      where: {
        submission_id: { _eq: $submission_id }
        event_type: { _eq: "asset_snapshot_repair_retry_requested" }
        actor_subject: { _eq: $actor_subject }
        payload: { _contains: $event_payload }
      }
    ) {
      id
    }
  }
`;

type AssetSnapshotRepairRetryRow = {
  id: string;
  asset_snapshot_repair_attempt_count: number;
  asset_snapshot_repair_next_at: string | null;
  asset_snapshot_repair_last_error: string | null;
  asset_snapshot_repair_dead_lettered_at: string | null;
};

const mapAssetSnapshotRepairRetry = (row: AssetSnapshotRepairRetryRow) => ({
  id: row.id,
  attemptCount: row.asset_snapshot_repair_attempt_count,
  nextAttemptAt: row.asset_snapshot_repair_next_at,
  lastError: row.asset_snapshot_repair_last_error,
  deadLetteredAt: row.asset_snapshot_repair_dead_lettered_at,
});

export const retryReviewerAssetSnapshotRepair = async ({
  submissionId,
  operationId,
  actor,
}: {
  submissionId: string;
  operationId: string;
  actor: AdminUser;
}) => {
  const client = await getAPIServiceGraphqlClient();
  const result = await client.request<{
    reviewer_retry_app_review_asset_snapshot_repair: AssetSnapshotRepairRetryRow[];
  }>(RetryReviewerAssetSnapshotRepair, {
    submission_id: submissionId,
    operation_id: operationId,
    actor_subject: actor.subject,
    actor_email: actor.email,
  });
  const row = result.reviewer_retry_app_review_asset_snapshot_repair[0];
  return row ? mapAssetSnapshotRepairRetry(row) : null;
};

export const reconcileReviewerAssetSnapshotRepairRetry = async ({
  submissionId,
  operationId,
  actor,
}: {
  submissionId: string;
  operationId: string;
  actor: AdminUser;
}) => {
  const client = await getAPIServiceGraphqlClient();
  const result = await client.request<{
    app_review_submission_by_pk: AssetSnapshotRepairRetryRow | null;
    app_review_event: Array<{ id: string }>;
  }>(FindReviewerAssetSnapshotRepairRetryOutcome, {
    submission_id: submissionId,
    actor_subject: actor.subject,
    event_payload: { operation_id: operationId },
  });
  return result.app_review_submission_by_pk && result.app_review_event.length
    ? mapAssetSnapshotRepairRetry(result.app_review_submission_by_pk)
    : null;
};

export const repairReviewerAssetSnapshots = async ({
  limit,
}: {
  limit: number;
}) => {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new Error("Reviewer asset snapshot repair limit is invalid.");
  }

  const client = await getAPIServiceGraphqlClient();
  const result = await client.request<{
    app_review_submission: RepairCandidate[];
  }>(FetchMissingReviewerAssetSnapshots, {
    limit,
    now: new Date().toISOString(),
  });
  const candidates = result.app_review_submission;
  let repaired = 0;
  let attempted = 0;
  let skipped = 0;
  let failed = 0;
  let deadLettered = 0;

  const recordFailure = async (candidate: RepairCandidate) => {
    try {
      const recorded = await client.request<{
        reviewer_fail_app_review_asset_snapshot_repair: Array<{
          asset_snapshot_repair_dead_lettered_at: string | null;
        }>;
      }>(FailReviewerAssetSnapshotRepair, {
        submission_id: candidate.id,
        expected_review_version: candidate.review_version,
        expected_attempt_count: candidate.asset_snapshot_repair_attempt_count,
        error: "Reviewer submission asset snapshot failed.",
      });
      return Boolean(
        recorded.reviewer_fail_app_review_asset_snapshot_repair[0]
          ?.asset_snapshot_repair_dead_lettered_at,
      );
    } catch {
      // Leave it immediately eligible when durable scheduling is unavailable.
      return false;
    }
  };

  for (const candidate of candidates) {
    const operationId = randomUUID();
    let began = false;
    for (let attempt = 0; attempt < 2 && !began; attempt += 1) {
      try {
        const result = await client.request<{
          reviewer_begin_app_review_asset_snapshot_repair: Array<{
            id: string;
          }>;
        }>(BeginReviewerAssetSnapshotRepair, {
          submission_id: candidate.id,
          expected_review_version: candidate.review_version,
          expected_attempt_count: candidate.asset_snapshot_repair_attempt_count,
          operation_id: operationId,
        });
        began =
          result.reviewer_begin_app_review_asset_snapshot_repair.length === 1;
      } catch {
        // Retry the same idempotency key once to reconcile a lost response.
      }
    }
    if (!began) {
      skipped += 1;
      continue;
    }
    attempted += 1;

    let assetSnapshot: ReviewerSubmissionAssetSnapshot | null = null;
    try {
      assetSnapshot = await snapshotReviewerSubmissionAssets({
        appId: candidate.app_id,
        appMetadataId: candidate.app_metadata_id,
        metadataSnapshot: candidate.metadata_snapshot,
        localizationsSnapshot: candidate.localizations_snapshot,
      });
    } catch {
      failed += 1;
      if (await recordFailure(candidate)) deadLettered += 1;
      continue;
    }

    let persisted;
    try {
      persisted = await client.request<{
        reviewer_set_app_review_asset_snapshot: Array<{ id: string }>;
      }>(SetReviewerAssetSnapshot, {
        submission_id: candidate.id,
        expected_review_version: candidate.review_version,
        asset_snapshot: assetSnapshot,
      });
    } catch {
      try {
        const outcome = await client.request<{
          reconcile_app_review_asset_snapshot_repair: Array<{ id: string }>;
        }>(ReconcileReviewerAssetSnapshotRepairOutcome, {
          submission_id: candidate.id,
          asset_snapshot: assetSnapshot,
        });
        if (outcome.reconcile_app_review_asset_snapshot_repair.length === 1) {
          repaired += 1;
          continue;
        }
      } catch {
        // The write outcome is ambiguous. Retain operation-unique objects:
        // they may now be referenced by the committed manifest.
        failed += 1;
        continue;
      }

      failed += 1;
      await tryDeleteReviewerSubmissionAssetSnapshot({
        appId: candidate.app_id,
        appMetadataId: candidate.app_metadata_id,
        assetSnapshot,
      });
      if (await recordFailure(candidate)) deadLettered += 1;
      continue;
    }

    if (persisted.reviewer_set_app_review_asset_snapshot.length === 1) {
      repaired += 1;
      continue;
    }

    skipped += 1;
    await tryDeleteReviewerSubmissionAssetSnapshot({
      appId: candidate.app_id,
      appMetadataId: candidate.app_metadata_id,
      assetSnapshot,
    });
  }

  return {
    attempted,
    repaired,
    skipped,
    failed,
    deadLettered,
  };
};
