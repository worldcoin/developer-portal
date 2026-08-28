import {
  getSdk,
  type FetchReviewDecisionContextQuery,
  type FetchReviewDecisionOutcomeQuery,
  type DecideReviewSubmissionMutationVariables,
  type EnqueueReviewAssetCleanupMutationVariables,
  type SettleReviewAssetCleanupMutationVariables,
} from "@/api/admin/reviewer/graphql/reviewer-workflow.generated";
import type { StoredReviewChecklist } from "@/api/admin/reviewer/request-schema";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import type { AdminUser } from "@/lib/admin-auth";
import "server-only";

export type ReviewerWorkflowSubmission = {
  id: string;
  status: string;
  reviewVersion: number;
  claimToken: string | null;
  claimExpiresAt: string | null;
  checklistVersion: string | null;
  checklist: Record<string, unknown>;
};

type WorkflowRow = {
  id: unknown;
  status: string;
  review_version: number;
  claim_token?: unknown | null;
  claim_expires_at?: string | null;
  checklist_version?: string | null;
  checklist: Record<string, unknown>;
};

export const mapReviewerWorkflowSubmission = (
  row: WorkflowRow,
): ReviewerWorkflowSubmission => ({
  id: String(row.id),
  status: row.status,
  reviewVersion: row.review_version,
  claimToken: row.claim_token == null ? null : String(row.claim_token),
  claimExpiresAt: row.claim_expires_at ?? null,
  checklistVersion: row.checklist_version ?? null,
  checklist: row.checklist,
});

const sdk = async () => getSdk(await getAPIServiceGraphqlClient());

export type ReviewChecklistContext = {
  appMode: "mini-app" | "external";
  checklistVersion: string | null;
};

export const fetchReviewChecklistContext = async (
  submissionId: string,
): Promise<ReviewChecklistContext | null> => {
  const result = await (
    await sdk()
  ).FetchReviewChecklistContext({ submission_id: submissionId });
  const row = result.app_review_submission_by_pk;
  if (!row || (row.app_mode !== "mini-app" && row.app_mode !== "external")) {
    return null;
  }

  return {
    appMode: row.app_mode,
    checklistVersion: row.checklist_version ?? null,
  };
};

export const claimReviewSubmission = async (
  submissionId: string,
  expectedReviewVersion: number,
  actor: AdminUser,
) => {
  const result = await (
    await sdk()
  ).ClaimReviewSubmission({
    submission_id: submissionId,
    expected_review_version: expectedReviewVersion,
    actor_subject: actor.subject,
    actor_email: actor.email,
  });
  const row = result.reviewer_claim_app_review_submission[0];
  return row ? mapReviewerWorkflowSubmission(row) : null;
};

type ClaimedWrite = {
  submissionId: string;
  claimToken: string;
  expectedReviewVersion: number;
  actor: AdminUser;
};

const claimedVariables = (input: ClaimedWrite) => ({
  submission_id: input.submissionId,
  claim_token: input.claimToken,
  expected_review_version: input.expectedReviewVersion,
  actor_subject: input.actor.subject,
  actor_email: input.actor.email,
});

export const heartbeatReviewSubmission = async (input: ClaimedWrite) => {
  const result = await (
    await sdk()
  ).HeartbeatReviewSubmission(claimedVariables(input));
  const row = result.reviewer_heartbeat_app_review_submission[0];
  return row ? mapReviewerWorkflowSubmission(row) : null;
};

export const releaseReviewSubmission = async (input: ClaimedWrite) => {
  const result = await (
    await sdk()
  ).ReleaseReviewSubmission(claimedVariables(input));
  const row = result.reviewer_release_app_review_submission[0];
  return row ? mapReviewerWorkflowSubmission(row) : null;
};

export const saveReviewChecklist = async (
  input: ClaimedWrite & {
    checklistVersion: string;
    checklist: StoredReviewChecklist;
  },
) => {
  const result = await (
    await sdk()
  ).SaveReviewChecklist({
    ...claimedVariables(input),
    checklist_version: input.checklistVersion,
    checklist: input.checklist,
  });
  const row = result.reviewer_save_app_review_checklist[0];
  return row ? mapReviewerWorkflowSubmission(row) : null;
};

export type ReviewDecisionContext = NonNullable<
  FetchReviewDecisionContextQuery["app_review_submission_by_pk"]
>;

export type ReviewDecisionOutcome = NonNullable<
  FetchReviewDecisionOutcomeQuery["app_review_submission_by_pk"]
>;

export const fetchReviewDecisionContext = async (
  submissionId: string,
): Promise<ReviewDecisionContext | null> => {
  const result = await (
    await sdk()
  ).FetchReviewDecisionContext({ submission_id: submissionId });
  return result.app_review_submission_by_pk ?? null;
};

export const fetchReviewDecisionOutcome = async (
  submissionId: string,
): Promise<ReviewDecisionOutcome | null> => {
  const result = await (
    await sdk()
  ).FetchReviewDecisionOutcome({ submission_id: submissionId });
  return result.app_review_submission_by_pk ?? null;
};

export const decideReviewSubmission = async (
  variables: DecideReviewSubmissionMutationVariables,
) => {
  const result = await (await sdk()).DecideReviewSubmission(variables);
  const row = result.reviewer_decide_app_review_submission[0];
  return row
    ? {
        submission: mapReviewerWorkflowSubmission(row),
        decisionResult: row.decision_result,
      }
    : null;
};

export const enqueueReviewAssetCleanup = async (
  variables: EnqueueReviewAssetCleanupMutationVariables,
) => {
  const result = await (await sdk()).EnqueueReviewAssetCleanup(variables);
  return result.reviewer_enqueue_app_review_asset_cleanup[0] ?? null;
};

export const settleReviewAssetCleanup = async (
  variables: SettleReviewAssetCleanupMutationVariables,
) => {
  const result = await (await sdk()).SettleReviewAssetCleanup(variables);
  return result.reviewer_settle_app_review_asset_cleanup[0] ?? null;
};

export const hasActiveListingReview = async (
  appMetadataId: string,
): Promise<boolean> => {
  const result = await (
    await sdk()
  ).HasActiveListingReview({ app_metadata_id: appMetadataId });
  return result.app_review_submission.length > 0;
};
