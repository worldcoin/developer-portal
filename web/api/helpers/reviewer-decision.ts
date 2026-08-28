import type {
  DecisionWriteBody,
  ReviewChecklist,
  ReviewChecklistDefinitionSnapshot,
  StoredReviewChecklist,
} from "@/api/admin/reviewer/request-schema";
import type {
  ReviewDecisionContext,
  ReviewDecisionOutcome,
} from "@/api/helpers/reviewer-workflow";
import { isValidCredentiallessHttpsUrl } from "@/api/helpers/integration-url";
import { readReviewerSubmissionAssetSnapshot } from "@/api/helpers/reviewer-submission-assets";
import {
  createChecklistDefinitionSnapshot,
  getChecklistDefinitions,
  isReviewChecklistVersionSupported,
  validateApprovalChecklist,
  validateChecklistDraft,
} from "@/scenes/Admin/reviewer/checklist";
import { createHash } from "node:crypto";
import "server-only";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stableJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
};

export const createReviewDecisionFingerprint = ({
  actorSubject,
  submissionId,
  body,
}: {
  actorSubject: string;
  submissionId: string;
  body: DecisionWriteBody;
}) =>
  createHash("sha256")
    .update(
      stableJson({
        actorSubject,
        submissionId,
        claimToken: body.claimToken,
        expectedReviewVersion: body.expectedReviewVersion,
        appMetadataId: body.appMetadataId,
        expectedMetadataUpdatedAt: body.expectedMetadataUpdatedAt,
        decision: body.decision,
        developerMessage: body.developerMessage.trim(),
        overrideReason: body.overrideReason?.trim() ?? "",
      }),
    )
    .digest("hex");

const readStoredChecklist = (value: unknown): StoredReviewChecklist | null => {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  if (typeof value.internalNotes !== "string") return null;
  if (!isRecord(value.definitionSnapshot)) return null;

  const snapshot = value.definitionSnapshot;
  if (
    (snapshot.mode !== "mini-app" && snapshot.mode !== "external") ||
    !Array.isArray(snapshot.items)
  ) {
    return null;
  }
  const snapshotItems: ReviewChecklistDefinitionSnapshot["items"] = [];
  for (const raw of snapshot.items) {
    if (
      !isRecord(raw) ||
      typeof raw.id !== "string" ||
      typeof raw.label !== "string" ||
      typeof raw.description !== "string" ||
      typeof raw.sourceUrl !== "string" ||
      typeof raw.conditional !== "boolean"
    ) {
      return null;
    }
    snapshotItems.push({
      id: raw.id,
      label: raw.label,
      description: raw.description,
      sourceUrl: raw.sourceUrl,
      conditional: raw.conditional,
    });
  }

  const items: ReviewChecklist["items"] = [];
  for (const raw of value.items) {
    if (
      !isRecord(raw) ||
      typeof raw.id !== "string" ||
      (raw.status !== "pass" && raw.status !== "fail" && raw.status !== "na") ||
      typeof raw.evidence !== "string" ||
      (raw.applicabilityNote !== undefined &&
        typeof raw.applicabilityNote !== "string")
    ) {
      return null;
    }
    items.push({
      id: raw.id,
      status: raw.status,
      evidence: raw.evidence,
      ...(raw.applicabilityNote === undefined
        ? {}
        : { applicabilityNote: raw.applicabilityNote }),
    });
  }

  return {
    items,
    internalNotes: value.internalNotes,
    definitionSnapshot: {
      mode: snapshot.mode,
      items: snapshotItems,
    },
  };
};

const decisionFromResult = (value: unknown) =>
  isRecord(value) &&
  (value.decision === "approved" || value.decision === "changes_requested")
    ? value.decision
    : null;

export const readCommittedPreparedAssetKeys = (
  decisionResult: unknown,
): string[] | null => {
  if (!isRecord(decisionResult)) return null;
  const keys = decisionResult.prepared_asset_keys;
  if (!Array.isArray(keys) || keys.some((key) => typeof key !== "string")) {
    return null;
  }
  const uniqueKeys = [...new Set(keys)];
  return uniqueKeys.length === keys.length ? uniqueKeys : null;
};

export const isSamePreparedAssetPlan = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((key, index) => key === sortedRight[index]);
};

export const isMatchingTerminalReviewDecision = (
  row: Pick<
    ReviewDecisionContext | ReviewDecisionOutcome,
    "status" | "decision_fingerprint" | "decision_result" | "decided_by_subject"
  >,
  fingerprint: string,
  actorSubject: string,
  decision: DecisionWriteBody["decision"],
) =>
  (row.status === "approved" || row.status === "changes_requested") &&
  row.decision_fingerprint === fingerprint &&
  row.decided_by_subject === actorSubject &&
  decisionFromResult(row.decision_result) === decision;

export type FailedReviewCheck = { id: string; label: string };

export type ValidatedReviewDecision = {
  checklist: StoredReviewChecklist;
  failedChecks: FailedReviewCheck[];
  developerMessage: string;
  priorVerified: ReviewDecisionContext["app"]["app_metadata"][number] | null;
};

export const validateReviewDecisionContext = ({
  actorSubject,
  body,
  context,
}: {
  actorSubject: string;
  body: DecisionWriteBody;
  context: ReviewDecisionContext;
}): ValidatedReviewDecision | null => {
  const mode = context.app_mode;
  const currentMetadata = context.app_metadata;
  const submittedSnapshot = context.metadata_snapshot;
  if (
    (mode !== "mini-app" && mode !== "external") ||
    context.status !== "in_review" ||
    context.review_version !== body.expectedReviewVersion ||
    String(context.claim_token ?? "") !== body.claimToken ||
    context.claimed_by_subject !== actorSubject ||
    !context.claim_expires_at ||
    Date.parse(context.claim_expires_at) <= Date.now() ||
    context.app_metadata_id !== body.appMetadataId ||
    context.metadata_updated_at !== body.expectedMetadataUpdatedAt ||
    !context.listing_consent ||
    context.listing_target !==
      (mode === "mini-app" ? "mini_app_store" : "world_ecosystem") ||
    context.app.id !== context.app_id ||
    context.app.is_staging ||
    context.app.is_banned !== false ||
    context.app.deleted_at !== null ||
    context.app.status !== "active" ||
    context.app.is_archived ||
    !currentMetadata ||
    currentMetadata.id !== body.appMetadataId ||
    currentMetadata.app_id !== context.app_id ||
    currentMetadata.updated_at !== body.expectedMetadataUpdatedAt ||
    currentMetadata.verification_status !== "awaiting_review" ||
    currentMetadata.app_mode !== mode ||
    !currentMetadata.is_developer_allow_listing ||
    !isRecord(submittedSnapshot) ||
    submittedSnapshot.app_mode !== mode ||
    submittedSnapshot.is_developer_allow_listing !== true ||
    (body.decision === "approved" &&
      (!isValidCredentiallessHttpsUrl(currentMetadata.integration_url) ||
        !isValidCredentiallessHttpsUrl(submittedSnapshot.integration_url))) ||
    !Array.isArray(context.localizations_snapshot)
  ) {
    return null;
  }

  if (body.decision === "approved") {
    try {
      readReviewerSubmissionAssetSnapshot({
        appId: context.app_id,
        appMetadataId: context.app_metadata_id,
        value: context.asset_snapshot,
      });
    } catch {
      return null;
    }
  }

  const version = context.checklist_version;
  if (!version || !isReviewChecklistVersionSupported(version)) return null;
  const checklist = readStoredChecklist(context.checklist);
  const expectedSnapshot = createChecklistDefinitionSnapshot(mode, version);
  if (
    !checklist?.definitionSnapshot ||
    !expectedSnapshot ||
    stableJson(checklist.definitionSnapshot) !== stableJson(expectedSnapshot) ||
    validateChecklistDraft(mode, checklist, version).length > 0
  ) {
    return null;
  }

  if (
    body.decision === "approved" &&
    validateApprovalChecklist(
      mode,
      checklist,
      body.overrideReason ?? "",
      version,
    ).length > 0
  ) {
    return null;
  }

  const results = new Map(checklist.items.map((item) => [item.id, item]));
  const failedChecks = getChecklistDefinitions(mode, version)
    .filter(({ id }) => results.get(id)?.status === "fail")
    .map(({ id, title }) => ({ id, label: title }));
  const customMessage = body.developerMessage.trim();
  const developerMessage =
    body.decision === "changes_requested" && failedChecks.length > 0
      ? `${customMessage}\n\nFailed guideline checks:\n${failedChecks
          .map(({ label }) => `- ${label}`)
          .join("\n")}`
      : customMessage;

  const priorRows = context.app.app_metadata.filter(
    (metadata) =>
      metadata.id !== body.appMetadataId &&
      metadata.verification_status === "verified",
  );
  if (priorRows.length > 1) return null;

  return {
    checklist,
    failedChecks,
    developerMessage,
    priorVerified: priorRows[0] ?? null,
  };
};
