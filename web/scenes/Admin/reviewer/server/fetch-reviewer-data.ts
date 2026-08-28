import "server-only";

import type {
  ReviewChecklistDefinitionSnapshot,
  StoredReviewChecklist,
} from "@/api/admin/reviewer/request-schema";
import { getInternalDashboardGraphqlClient } from "@/api/helpers/graphql";
import {
  fetchReviewerLiveMetadata,
  type ReviewerLiveMetadata,
} from "@/api/helpers/reviewer-live-metadata";
import gql from "graphql-tag";

import {
  type FetchReviewerQueueQuery,
  getSdk as getQueueSdk,
} from "../graphql/server/fetch-reviewer-queue.generated";
import {
  type FetchReviewerSubmissionQuery,
  getSdk as getSubmissionSdk,
} from "../graphql/server/fetch-reviewer-submission.generated";
import {
  REVIEWER_QUEUE_PAGE_SIZE,
  createReviewerQueueWhere,
  type ReviewerQueueFilters,
} from "../queue-filters";
import type {
  ReviewerAppMode,
  ReviewerQueueRow,
  ReviewerSubmissionDetail,
  ReviewerSubmissionStatus,
  ReviewerWorldIdConfiguration,
} from "../types";

type QueueRecord = FetchReviewerQueueQuery["app_review_submission"][number];
type DetailRecord = NonNullable<
  FetchReviewerSubmissionQuery["app_review_submission_by_pk"]
>;

const FetchReviewerSubmissionAssetContext = gql`
  query FetchReviewerSubmissionAssetContext($reviewId: uuid!) {
    app_review_submission_by_pk(id: $reviewId) {
      app_id
      app_metadata_id
      asset_snapshot
      localizations_snapshot
      metadata_snapshot
    }
  }
`;

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const records = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.map(record) : [];

const stringValue = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const nullableString = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const numberValue = (value: unknown): number =>
  typeof value === "number" ? value : 0;

const mapWorldIdConfiguration = (
  value: unknown,
): ReviewerWorldIdConfiguration => {
  const snapshot = record(value);
  const config = record(snapshot.config);
  const lifecycle = record(snapshot.lifecycle);
  const lifecycleByRpId = new Map(
    records(lifecycle.registrations).map((registration) => [
      stringValue(registration.rp_id),
      registration,
    ]),
  );

  return {
    legacyActions: records(config.legacy_actions).map((action) => ({
      action: stringValue(action.action),
      appFlowOnComplete: nullableString(action.app_flow_on_complete),
      creationMode: stringValue(action.creation_mode),
      description: stringValue(action.description),
      id: stringValue(action.id),
      kioskEnabled:
        typeof action.kiosk_enabled === "boolean"
          ? action.kiosk_enabled
          : false,
      maxAccountsPerUser: numberValue(action.max_accounts_per_user),
      maxVerifications: numberValue(action.max_verifications),
      name: stringValue(action.name),
      postActionDeepLinkAndroid: nullableString(
        action.post_action_deep_link_android,
      ),
      postActionDeepLinkIos: nullableString(action.post_action_deep_link_ios),
      privacyPolicyUri: nullableString(action.privacy_policy_uri),
      status: stringValue(action.status),
      termsUri: nullableString(action.terms_uri),
      webhookUri: nullableString(action.webhook_uri),
      redirects: records(action.redirects).map((redirect) => ({
        id: stringValue(redirect.id),
        redirectUri: stringValue(redirect.redirect_uri),
      })),
    })),
    registrations: records(config.registrations).map((registration) => {
      const rpId = stringValue(registration.rp_id);
      const submittedLifecycle = lifecycleByRpId.get(rpId) ?? {};
      return {
        mode: stringValue(registration.mode),
        rpId,
        signerAddress: nullableString(registration.signer_address),
        stagingStatus: nullableString(submittedLifecycle.staging_status),
        status: stringValue(submittedLifecycle.status, "unknown"),
        actions: records(registration.actions).map((action) => ({
          action: stringValue(action.action),
          description: stringValue(action.description),
          environment: stringValue(action.environment),
          id: stringValue(action.id),
        })),
      };
    }),
  };
};

const checklistStatuses = new Set(["pass", "fail", "na"]);

const normalizeDefinitionSnapshot = (
  value: unknown,
): ReviewChecklistDefinitionSnapshot | undefined => {
  const raw = record(value);
  if (
    (raw.mode !== "mini-app" && raw.mode !== "external") ||
    !Array.isArray(raw.items)
  ) {
    return undefined;
  }

  const ids = new Set<string>();
  const items: ReviewChecklistDefinitionSnapshot["items"] = [];
  for (const value of raw.items) {
    const item = record(value);
    if (
      typeof item.id !== "string" ||
      !item.id ||
      ids.has(item.id) ||
      typeof item.label !== "string" ||
      typeof item.description !== "string" ||
      typeof item.sourceUrl !== "string" ||
      typeof item.conditional !== "boolean"
    ) {
      return undefined;
    }
    ids.add(item.id);
    items.push({
      id: item.id,
      label: item.label,
      description: item.description,
      sourceUrl: item.sourceUrl,
      conditional: item.conditional,
    });
  }

  return { mode: raw.mode, items };
};

const normalizeChecklist = (value: unknown): StoredReviewChecklist => {
  const raw = record(value);
  const items = Array.isArray(raw.items)
    ? raw.items.flatMap((value) => {
        const item = record(value);
        if (
          typeof item.id !== "string" ||
          typeof item.status !== "string" ||
          !checklistStatuses.has(item.status) ||
          typeof item.evidence !== "string"
        ) {
          return [];
        }
        return [
          {
            id: item.id,
            status: item.status as "pass" | "fail" | "na",
            evidence: item.evidence,
            ...(typeof item.applicabilityNote === "string"
              ? { applicabilityNote: item.applicabilityNote }
              : {}),
          },
        ];
      })
    : [];

  const definitionSnapshot = normalizeDefinitionSnapshot(
    raw.definitionSnapshot,
  );

  return {
    items,
    internalNotes:
      typeof raw.internalNotes === "string" ? raw.internalNotes : "",
    ...(definitionSnapshot ? { definitionSnapshot } : {}),
  };
};

const queueRow = (row: QueueRecord): ReviewerQueueRow => {
  const metadataSnapshot = record(row.metadata_snapshot);
  return {
    id: String(row.id),
    appId: row.app_id,
    appMetadataId: row.app_metadata_id,
    appName:
      typeof metadataSnapshot.name === "string"
        ? metadataSnapshot.name
        : row.app.name,
    appMode: row.app_mode as ReviewerAppMode,
    attempt: row.attempt,
    changelog: row.changelog,
    claimedByEmail: row.claimed_by_email ?? null,
    claimExpiresAt: row.claim_expires_at ?? null,
    listingTarget: row.listing_target as ReviewerQueueRow["listingTarget"],
    reviewVersion: row.review_version,
    status: row.status as ReviewerSubmissionStatus,
    submittedAt: row.submitted_at,
    teamId: row.team.id,
    teamName: row.team.name ?? "Unnamed team",
  };
};

export const fetchReviewerQueue = async ({
  filters,
  reviewerEmail,
  now = new Date(),
}: {
  filters: ReviewerQueueFilters;
  reviewerEmail: string;
  now?: Date;
}): Promise<{ submissions: ReviewerQueueRow[]; hasNextPage: boolean }> => {
  const client = await getInternalDashboardGraphqlClient();
  const result = await getQueueSdk(client).FetchReviewerQueue({
    limit: REVIEWER_QUEUE_PAGE_SIZE + 1,
    offset: (filters.page - 1) * REVIEWER_QUEUE_PAGE_SIZE,
    where: createReviewerQueueWhere(filters, reviewerEmail, now),
  });
  return {
    submissions: result.app_review_submission
      .slice(0, REVIEWER_QUEUE_PAGE_SIZE)
      .map(queueRow),
    hasNextPage: result.app_review_submission.length > REVIEWER_QUEUE_PAGE_SIZE,
  };
};

const mapDetail = (
  row: DetailRecord,
  live: ReviewerLiveMetadata | null,
): ReviewerSubmissionDetail => {
  const liveLocalizations = live?.localisations ?? [];
  const liveMetadata = live
    ? Object.fromEntries(
        Object.entries(live).filter(([key]) => key !== "localisations"),
      )
    : null;

  return {
    ...queueRow(row),
    assetSnapshotRepair: {
      ready: row.asset_snapshot != null,
      attemptCount: row.asset_snapshot_repair_attempt_count,
      deadLetteredAt: row.asset_snapshot_repair_dead_lettered_at ?? null,
      lastError: row.asset_snapshot_repair_last_error ?? null,
      nextAttemptAt: row.asset_snapshot_repair_next_at ?? null,
    },
    checklist: normalizeChecklist(row.checklist),
    checklistVersion: row.checklist_version ?? null,
    claimedAt: row.claimed_at ?? null,
    completedAt: row.completed_at ?? null,
    decidedAt: row.decided_at ?? null,
    decidedByEmail: row.decided_by_email ?? null,
    decisionSummary: row.decision_summary ?? null,
    events: row.events.map((event) => ({
      id: String(event.id),
      eventType: event.event_type,
      eventSequence: event.event_sequence,
      actorEmail: event.actor_email ?? null,
      actorSubject: event.actor_subject ?? null,
      createdAt: event.created_at,
      payload: record(event.payload),
      reviewVersion: event.review_version ?? null,
    })),
    listingConsent: row.listing_consent,
    localizationsSnapshot: records(row.localizations_snapshot),
    metadataSnapshot: record(row.metadata_snapshot),
    metadataUpdatedAt: row.metadata_updated_at,
    notifications: row.notifications.map((notification) => ({
      id: String(notification.id),
      attemptCount: notification.attempt_count,
      channel: notification.channel,
      createdAt: notification.created_at,
      deliveredAt: notification.delivered_at ?? null,
      lastAttemptAt: notification.last_attempt_at ?? null,
      lastError: notification.last_error ?? null,
      nextAttemptAt: notification.next_attempt_at,
      notificationType: notification.notification_type,
      providerMessageId: notification.provider_message_id ?? null,
      recipient: notification.recipient ?? null,
      retryable: !notification.manual_retry_blocked,
      status: notification.status,
      updatedAt: notification.updated_at,
    })),
    liveMetadata: liveMetadata ? record(liveMetadata) : null,
    liveLocalizations: records(liveLocalizations),
    worldIdConfiguration: mapWorldIdConfiguration(
      row.world_id_configuration_snapshot,
    ),
  };
};

export const fetchReviewerSubmission = async (
  reviewId: string,
): Promise<ReviewerSubmissionDetail | null> => {
  const client = await getInternalDashboardGraphqlClient();
  const result = await getSubmissionSdk(client).FetchReviewerSubmission({
    reviewId,
  });
  if (!result.app_review_submission_by_pk) return null;
  const live = await fetchReviewerLiveMetadata(
    result.app_review_submission_by_pk.app_id,
  );
  return mapDetail(result.app_review_submission_by_pk, live);
};

export const fetchReviewerSubmissionAssetContext = async (
  reviewId: string,
): Promise<{
  appId: string;
  appMetadataId: string;
  assetSnapshot: unknown;
  localizationsSnapshot: Array<Record<string, unknown>>;
  metadataSnapshot: Record<string, unknown>;
} | null> => {
  const client = await getInternalDashboardGraphqlClient();
  const result = await client.request<{
    app_review_submission_by_pk: {
      app_id: string;
      app_metadata_id: string;
      asset_snapshot: unknown;
      localizations_snapshot: unknown;
      metadata_snapshot: unknown;
    } | null;
  }>(FetchReviewerSubmissionAssetContext, { reviewId });
  const row = result.app_review_submission_by_pk;
  if (!row) return null;
  return {
    appId: row.app_id,
    appMetadataId: row.app_metadata_id,
    assetSnapshot: row.asset_snapshot,
    localizationsSnapshot: records(row.localizations_snapshot),
    metadataSnapshot: record(row.metadata_snapshot),
  };
};
