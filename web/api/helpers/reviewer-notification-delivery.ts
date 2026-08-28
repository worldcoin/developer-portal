import "server-only";

import {
  deletePreparedReviewerAssets,
  expireVerifiedReviewerAssets,
} from "@/api/helpers/reviewer-decision-assets";
import { invalidateAppCatalogCache } from "@/api/helpers/invalidate-app-catalog-cache";
import {
  beginSlackSubmissionDelivery,
  reconcilePreparedReviewAssetCleanup,
  type ReviewNotificationContext,
} from "@/api/helpers/reviewer-notifications";
import { sendEmailDetailed } from "@/api/helpers/send-email";
import { randomUUID } from "node:crypto";

type JsonRecord = Record<string, unknown>;

export type ReviewerDeliverySubmission = {
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

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const nonblankString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const submissionName = (submission: ReviewerDeliverySubmission) => {
  const snapshot = isRecord(submission.metadataSnapshot)
    ? submission.metadataSnapshot
    : {};
  return nonblankString(snapshot.name) ?? submission.appName;
};

const canonicalOrigin = (value: string) => {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(withProtocol);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search ||
    url.hash
  ) {
    throw new Error("Invalid configured origin.");
  }
  return url.origin;
};

const escapeSlack = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const slackMrkdwn = (prefix: string, value: string, limit: number) =>
  `${prefix}${escapeSlack(value).slice(0, limit - prefix.length)}`;

const slackPlainText = (value: string, limit = 2_900) =>
  value.replaceAll("<", "").replaceAll(">", "").slice(0, limit);

const submissionAge = (submittedAt: string, now: Date) => {
  const submitted = new Date(submittedAt).getTime();
  const elapsedMs = Number.isFinite(submitted)
    ? Math.max(0, now.getTime() - submitted)
    : 0;
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return "less than a minute";
  if (minutes === 1) return "1 minute";
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour";
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day" : `${days} days`;
};

export const buildReviewerSlackMessage = ({
  channelId,
  dashboardOrigin,
  notificationId,
  now,
  submission,
}: {
  channelId: string;
  dashboardOrigin: string;
  notificationId: string;
  now: Date;
  submission: ReviewerDeliverySubmission;
}) => {
  const appName = submissionName(submission);
  const reviewerUrl = `${canonicalOrigin(dashboardOrigin)}/admin/reviewer/${submission.id}`;
  const field = (label: string, value: string) =>
    slackMrkdwn(`*${label}*\n`, value, 2_000);
  const fields = [
    field("App", appName),
    field("Team", submission.teamName),
    field("Mode", submission.appMode),
    field("Listing target", submission.listingTarget),
    field("Submission age", submissionAge(submission.submittedAt, now)),
  ];

  return {
    channel: channelId,
    client_msg_id: notificationId,
    text: slackPlainText(`New app review: ${appName}`),
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: slackPlainText(`New app review: ${appName}`, 150),
        },
      },
      {
        type: "section",
        fields: fields.map((text) => ({ type: "mrkdwn", text })),
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: slackMrkdwn(
            "*Changelog*\n",
            submission.changelog || "No changelog provided.",
            3_000,
          ),
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Open review" },
            url: reviewerUrl,
          },
        ],
      },
    ],
  };
};

const listingTargetLabel = (
  listingTarget: ReviewerDeliverySubmission["listingTarget"],
) =>
  listingTarget === "mini_app_store"
    ? "Mini App Store"
    : "World ecosystem directory";

const failedChecks = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 200).flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const id = nonblankString(entry.id);
    const label = nonblankString(entry.label);
    return id && label
      ? [{ id: id.slice(0, 200), label: label.slice(0, 500) }]
      : [];
  });
};

export const buildReviewerDecisionEmail = ({
  notificationType,
  recipient,
  developerPortalOrigin,
  approvedTemplateId,
  changesRequestedTemplateId,
  submission,
  payload,
}: {
  notificationType: "decision_approved" | "decision_changes_requested";
  recipient: string;
  developerPortalOrigin: string;
  approvedTemplateId: string;
  changesRequestedTemplateId: string;
  submission: ReviewerDeliverySubmission;
  payload: unknown;
}) => {
  const normalizedRecipient = recipient.trim().toLowerCase();
  if (
    normalizedRecipient.length > 254 ||
    !/^[^\s@]{1,64}@[a-z0-9](?:[a-z0-9.-]{0,185}[a-z0-9])?\.[a-z]{2,63}$/i.test(
      normalizedRecipient,
    )
  ) {
    throw new Error("Invalid review email recipient.");
  }
  if (
    !approvedTemplateId.trim() ||
    approvedTemplateId.length > 200 ||
    !changesRequestedTemplateId.trim() ||
    changesRequestedTemplateId.length > 200
  ) {
    throw new Error("Invalid review email template configuration.");
  }
  const safePayload = isRecord(payload) ? payload : {};
  const status =
    notificationType === "decision_approved" ? "approved" : "changes_requested";

  return {
    recipient: normalizedRecipient,
    templateId:
      status === "approved" ? approvedTemplateId : changesRequestedTemplateId,
    templateData: {
      app_id: submission.appId,
      app_name: submissionName(submission).slice(0, 500),
      developer_message: (
        nonblankString(safePayload.developer_message) ??
        submission.decisionSummary ??
        ""
      ).slice(0, 20_000),
      failed_checks: failedChecks(safePayload.failed_checks),
      listing_target: listingTargetLabel(submission.listingTarget),
      portal_url: `${canonicalOrigin(developerPortalOrigin)}/teams/${encodeURIComponent(
        submission.teamId,
      )}/apps/${encodeURIComponent(submission.appId)}`,
      resubmission_instructions:
        status === "changes_requested"
          ? "Update the requested items in the Developer Portal, then resubmit the listing for review."
          : "",
      status,
    },
  };
};

const stringArray = (value: unknown): string[] | null => {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    return null;
  }
  return [...new Set(value)];
};

const sameStringSet = (left: string[], right: string[]) =>
  left.length === right.length &&
  [...left].sort().every((value, index) => value === [...right].sort()[index]);

export const getPreparedAssetDisposition = ({
  assetKeys,
  decisionFingerprint,
  expectedReviewVersion,
  now,
  settlementState,
  submission,
}: {
  assetKeys: string[];
  decisionFingerprint: string;
  expectedReviewVersion: number;
  now: Date;
  settlementState: string;
  submission: ReviewerDeliverySubmission;
}): "delete" | "defer" | "retain" => {
  const terminal = ["approved", "changes_requested", "withdrawn"].includes(
    submission.status,
  );
  if (terminal) {
    const result = isRecord(submission.decisionResult)
      ? submission.decisionResult
      : {};
    const committedKeys = stringArray(result.prepared_asset_keys);
    return submission.status === "approved" &&
      submission.decisionFingerprint === decisionFingerprint &&
      committedKeys !== null &&
      sameStringSet(committedKeys, assetKeys)
      ? "retain"
      : "delete";
  }

  if (settlementState === "aborted") return "delete";
  if (submission.reviewVersion !== expectedReviewVersion) return "delete";

  const claimExpiry = submission.claimExpiresAt
    ? new Date(submission.claimExpiresAt).getTime()
    : Number.NaN;
  if (!Number.isFinite(claimExpiry) || claimExpiry <= now.getTime()) {
    return "delete";
  }
  return settlementState === "pending" || settlementState === "committed"
    ? "defer"
    : "delete";
};

export const isAppPublishedInCatalog = (
  response: unknown,
  appId: string,
  appMode: "mini-app" | "external",
  expectedLogoFilename: string,
) => {
  if (!isRecord(response) || !isRecord(response.app_rankings)) return false;
  const rankings = response.app_rankings;
  const rows = [rankings.top_apps, rankings.highlights].flatMap((value) =>
    Array.isArray(value) ? value : [],
  );
  return rows.some((row) => {
    if (
      !isRecord(row) ||
      row.app_id !== appId ||
      row.app_mode !== appMode ||
      typeof row.logo_img_url !== "string"
    ) {
      return false;
    }
    try {
      const pathname = new URL(row.logo_img_url, "https://catalog.invalid")
        .pathname;
      return pathname.split("/").at(-1) === expectedLogoFilename;
    } catch {
      return false;
    }
  });
};

const expectedPublishedLogoFilename = (
  submission: ReviewerDeliverySubmission,
) => {
  const result = isRecord(submission.decisionResult)
    ? submission.decisionResult
    : {};
  const keys = stringArray(result.prepared_asset_keys);
  if (!keys) throw new Error("Publication verification failed.");
  const prefix = `verified/${submission.appId}/`;
  const logos = keys.flatMap((key) => {
    if (!key.startsWith(prefix)) return [];
    const filename = key.slice(prefix.length);
    return /^review_[A-Za-z0-9_-]+_[a-f0-9]{16,64}_logo\.(?:png|jpg)$/.test(
      filename,
    )
      ? [filename]
      : [];
  });
  if (logos.length !== 1) throw new Error("Publication verification failed.");
  return logos[0];
};

const requiredConfig = (name: string, maxLength = 1_000) => {
  const value = process.env[name]?.trim();
  if (!value || value.length > maxLength) {
    throw new Error(`Review notification ${name} is not configured.`);
  }
  return value;
};

const safeAssetKeys = (
  value: unknown,
  appId: string,
  allowLegacyJpeg: boolean,
) => {
  if (!/^[A-Za-z0-9_-]+$/.test(appId) || !Array.isArray(value)) {
    throw new Error("Invalid reviewer asset cleanup payload.");
  }
  if (value.length === 0 || value.length > 1_000) {
    throw new Error("Invalid reviewer asset cleanup payload.");
  }
  const prefix = `verified/${appId}/`;
  const keys: string[] = [];
  for (const key of value) {
    if (
      typeof key !== "string" ||
      !key.startsWith(prefix) ||
      !(allowLegacyJpeg
        ? /^verified\/[A-Za-z0-9_-]+\/(?:[A-Za-z0-9_-]+\/)?[A-Za-z0-9_-]+\.(?:png|jpe?g)$/.test(
            key,
          )
        : /^verified\/[A-Za-z0-9_-]+\/(?:[A-Za-z0-9_-]+\/)?[A-Za-z0-9_-]+\.(?:png|jpg)$/.test(
            key,
          )) ||
      keys.includes(key)
    ) {
      throw new Error("Invalid reviewer asset cleanup payload.");
    }
    keys.push(key);
  }
  return keys;
};

type DeliveryDependencies = {
  fetchImpl?: typeof fetch;
  sendEmailDetailedImpl?: typeof sendEmailDetailed;
  invalidateCatalogCacheImpl?: typeof invalidateAppCatalogCache;
  deletePreparedAssetsImpl?: typeof deletePreparedReviewerAssets;
  expireVerifiedAssetsImpl?: typeof expireVerifiedReviewerAssets;
  reconcilePreparedAssetsImpl?: typeof reconcilePreparedReviewAssetCleanup;
  beginSlackSubmissionDeliveryImpl?: typeof beginSlackSubmissionDelivery;
  now?: Date;
};

const sendSlackSubmission = async (
  context: ReviewNotificationContext,
  fetchImpl: typeof fetch,
  beginSlackSubmissionDeliveryImpl: typeof beginSlackSubmissionDelivery,
  now: Date,
) => {
  if (context.submission.status === "withdrawn") {
    throw new Error("Review submission is no longer active.");
  }
  const token = requiredConfig("SLACK_BOT_TOKEN", 1_000);
  const channelId = requiredConfig("SLACK_REVIEW_CHANNEL_ID", 100);
  if (!/^[A-Z0-9]{2,100}$/.test(channelId)) {
    throw new Error("Review notification Slack channel is invalid.");
  }
  const message = buildReviewerSlackMessage({
    channelId,
    dashboardOrigin: requiredConfig("INTERNAL_DASHBOARD_HOST", 500),
    notificationId: context.notification.id,
    now,
    submission: context.submission,
  });
  const workerId = context.notification.lockedBy;
  if (
    !workerId ||
    !(await beginSlackSubmissionDeliveryImpl({
      notificationId: context.notification.id,
      workerId,
      fenceToken: randomUUID(),
    }))
  ) {
    throw new Error(
      "Review submission Slack delivery is no longer authorized.",
    );
  }
  const response = await fetchImpl("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      ...message,
      unfurl_links: false,
      unfurl_media: false,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("Slack delivery failed.");
  }
  if (!response.ok || !isRecord(body) || body.ok !== true) {
    throw new Error("Slack delivery failed.");
  }
  return {
    outcome: "delivered" as const,
    providerMessageId: nonblankString(body.ts)?.slice(0, 512) ?? null,
  };
};

const sendDecisionEmail = async (
  context: ReviewNotificationContext,
  sendEmailDetailedImpl: typeof sendEmailDetailed,
) => {
  const type = context.notification.notificationType;
  if (type !== "decision_approved" && type !== "decision_changes_requested") {
    throw new Error("Unsupported review notification.");
  }
  if (!context.notification.recipient) {
    throw new Error("Review email recipient is missing.");
  }
  const email = buildReviewerDecisionEmail({
    notificationType: type,
    recipient: context.notification.recipient,
    developerPortalOrigin: requiredConfig("NEXT_PUBLIC_APP_URL", 500),
    approvedTemplateId: requiredConfig(
      "SENDGRID_REVIEW_APPROVED_TEMPLATE_ID",
      200,
    ),
    changesRequestedTemplateId: requiredConfig(
      "SENDGRID_REVIEW_CHANGES_REQUESTED_TEMPLATE_ID",
      200,
    ),
    submission: context.submission,
    payload: context.notification.payload,
  });
  const result = await sendEmailDetailedImpl({
    apiKey: requiredConfig("SENDGRID_API_KEY", 1_000),
    from: requiredConfig("SENDGRID_EMAIL_FROM", 320),
    to: email.recipient,
    templateId: email.templateId,
    templateData: email.templateData,
    customArgs: {
      review_notification_id: context.notification.id,
    },
  });
  return {
    outcome: "delivered" as const,
    providerMessageId: result.messageId,
  };
};

const verifyCatalogPublication = async (
  context: ReviewNotificationContext,
  fetchImpl: typeof fetch,
) => {
  const origin = canonicalOrigin(
    requiredConfig("NEXT_PUBLIC_IMAGES_CDN_URL", 500),
  );
  const limit = 1_500;
  const expectedLogoFilename = expectedPublishedLogoFilename(
    context.submission,
  );
  for (let page = 1; page <= 2; page += 1) {
    const url = new URL("/api/v2/public/apps", origin);
    url.searchParams.set("app_mode", context.submission.appMode);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("page", String(page));
    url.searchParams.set("skip_country_check", "true");
    if (context.submission.appMode === "external") {
      // Task 8 makes app_mode authoritative before pagination. show_external
      // keeps this check compatible while that route change rolls out first.
      url.searchParams.set("show_external", "true");
    }
    const response = await fetchImpl(url, {
      headers: {
        "Cache-Control": "no-cache",
        "x-accept-language": "en",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error("Publication verification failed.");
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new Error("Publication verification failed.");
    }
    if (
      isAppPublishedInCatalog(
        body,
        context.submission.appId,
        context.submission.appMode,
        expectedLogoFilename,
      )
    ) {
      return;
    }
    const rankings =
      isRecord(body) && isRecord(body.app_rankings) ? body.app_rankings : {};
    if (!Array.isArray(rankings.top_apps) || rankings.top_apps.length < limit) {
      break;
    }
  }
  throw new Error("Publication verification failed.");
};

const checkPublication = async (
  context: ReviewNotificationContext,
  fetchImpl: typeof fetch,
  invalidateCatalogCacheImpl: typeof invalidateAppCatalogCache,
) => {
  const invalidation = await invalidateCatalogCacheImpl({
    callerReference: `review:${context.notification.id}`,
    abortSignal: AbortSignal.timeout(15_000),
  });
  await verifyCatalogPublication(context, fetchImpl);
  return {
    outcome: "delivered" as const,
    providerMessageId:
      invalidation.invalidationId ??
      (invalidation.debounced ? "cloudfront:debounced" : null),
  };
};

const settleAssets = async (
  context: ReviewNotificationContext,
  deletePreparedAssetsImpl: typeof deletePreparedReviewerAssets,
  expireVerifiedAssetsImpl: typeof expireVerifiedReviewerAssets,
  reconcilePreparedAssetsImpl: typeof reconcilePreparedReviewAssetCleanup,
) => {
  const payload = isRecord(context.notification.payload)
    ? context.notification.payload
    : {};
  const cleanupKind = nonblankString(payload.cleanup_kind);
  const assetKeys = safeAssetKeys(
    payload.asset_keys,
    context.submission.appId,
    cleanupKind === "superseded_live_assets",
  );
  if (cleanupKind === "superseded_live_assets") {
    const failedKeys = await expireVerifiedAssetsImpl({
      keys: assetKeys,
      abortSignal: AbortSignal.timeout(15_000),
    });
    if (failedKeys.length > 0) {
      throw new Error("Reviewer asset expiry failed.");
    }
    return {
      outcome: "delivered" as const,
      providerMessageId: `asset-expired:${context.notification.id}`,
    };
  }
  if (cleanupKind !== "prepared_operation_settlement") {
    throw new Error("Invalid reviewer asset cleanup payload.");
  }
  const decisionFingerprint = nonblankString(payload.decision_fingerprint);
  const expectedReviewVersion = Number(payload.expected_review_version);
  const settlementState = nonblankString(payload.settlement_state);
  const operationId = nonblankString(payload.operation_id);
  const appMetadataId = nonblankString(payload.app_metadata_id);
  const workerId = nonblankString(context.notification.lockedBy);
  if (
    !decisionFingerprint ||
    !/^[a-f0-9]{64}$/.test(decisionFingerprint) ||
    !Number.isSafeInteger(expectedReviewVersion) ||
    expectedReviewVersion <= 0 ||
    !settlementState ||
    !["pending", "committed", "aborted"].includes(settlementState) ||
    !operationId ||
    !/^[a-f0-9]{16,64}$/.test(operationId) ||
    !workerId ||
    appMetadataId !== context.submission.appMetadataId ||
    !assetKeys.every((key) =>
      key
        .split("/")
        .at(-1)
        ?.startsWith(`review_${appMetadataId}_${operationId}_`),
    )
  ) {
    throw new Error("Invalid reviewer asset cleanup payload.");
  }

  const authoritativeSettlement = await reconcilePreparedAssetsImpl({
    notificationId: context.notification.id,
    submissionId: context.submission.id,
    decisionFingerprint,
    operationId,
    expectedReviewVersion,
    appMetadataId,
    assetKeys,
    workerId,
  });
  if (!authoritativeSettlement) {
    throw new Error("Reviewer asset cleanup reconciliation failed.");
  }
  if (authoritativeSettlement === "pending") {
    return {
      outcome: "deferred" as const,
      providerMessageId: null,
    };
  }
  const disposition =
    authoritativeSettlement === "committed" ? "retain" : "delete";
  if (disposition === "delete") {
    await deletePreparedAssetsImpl({
      keys: assetKeys,
      abortSignal: AbortSignal.timeout(15_000),
    });
  }
  return {
    outcome: "delivered" as const,
    providerMessageId: `asset-${disposition}:${context.notification.id}`,
  };
};

export const deliverReviewNotification = async (
  context: ReviewNotificationContext,
  dependencies: DeliveryDependencies = {},
): Promise<{
  outcome: "delivered" | "deferred";
  providerMessageId: string | null;
}> => {
  const { notification } = context;
  const tuple = `${notification.notificationType}/${notification.channel}`;
  const now = dependencies.now ?? new Date();
  if (tuple === "submission_received/slack") {
    return sendSlackSubmission(
      context,
      dependencies.fetchImpl ?? fetch,
      dependencies.beginSlackSubmissionDeliveryImpl ??
        beginSlackSubmissionDelivery,
      now,
    );
  }
  if (
    tuple === "decision_approved/email" ||
    tuple === "decision_changes_requested/email"
  ) {
    return sendDecisionEmail(
      context,
      dependencies.sendEmailDetailedImpl ?? sendEmailDetailed,
    );
  }
  if (tuple === "publication_check/publication") {
    return checkPublication(
      context,
      dependencies.fetchImpl ?? fetch,
      dependencies.invalidateCatalogCacheImpl ?? invalidateAppCatalogCache,
    );
  }
  if (tuple === "asset_cleanup/asset") {
    return settleAssets(
      context,
      dependencies.deletePreparedAssetsImpl ?? deletePreparedReviewerAssets,
      dependencies.expireVerifiedAssetsImpl ?? expireVerifiedReviewerAssets,
      dependencies.reconcilePreparedAssetsImpl ??
        reconcilePreparedReviewAssetCleanup,
    );
  }
  throw new Error("Unsupported review notification.");
};
