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
} from "../types";

type QueueRecord = FetchReviewerQueueQuery["app_review_submission"][number];
type DetailRecord = NonNullable<
  FetchReviewerSubmissionQuery["app_review_submission_by_pk"]
>;

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const records = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.map(record) : [];

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
      lastError: notification.last_error ?? null,
      notificationType: notification.notification_type,
      recipient: notification.recipient ?? null,
      status: notification.status,
    })),
    liveMetadata: liveMetadata ? record(liveMetadata) : null,
    liveLocalizations: records(liveLocalizations),
    worldIdConfiguration: {
      legacyActions: row.app.actions.map((action) => ({
        action: action.action,
        appFlowOnComplete: action.app_flow_on_complete
          ? String(action.app_flow_on_complete)
          : null,
        creationMode: action.creation_mode,
        description: action.description,
        id: action.id,
        kioskEnabled: action.kiosk_enabled,
        maxAccountsPerUser: action.max_accounts_per_user,
        maxVerifications: action.max_verifications,
        name: action.name,
        postActionDeepLinkAndroid: action.post_action_deep_link_android ?? null,
        postActionDeepLinkIos: action.post_action_deep_link_ios ?? null,
        privacyPolicyUri: action.privacy_policy_uri ?? null,
        status: action.status,
        termsUri: action.terms_uri ?? null,
        webhookUri: action.webhook_uri ?? null,
      })),
      registrations: row.app.rp_registration.map((registration) => ({
        mode: String(registration.mode),
        rpId: registration.rp_id,
        signerAddress: registration.signer_address ?? null,
        stagingStatus: registration.staging_status
          ? String(registration.staging_status)
          : null,
        status: String(registration.status),
        actions: registration.actions_v4.map((action) => ({
          action: action.action,
          description: action.description,
          environment: String(action.environment),
          id: action.id,
        })),
      })),
    },
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
