import { getSdk } from "@/api/admin/reviewer/graphql/reviewer-workflow.generated";
import type { ReviewChecklist } from "@/api/admin/reviewer/request-schema";
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

const mapSubmission = (row: WorkflowRow): ReviewerWorkflowSubmission => ({
  id: String(row.id),
  status: row.status,
  reviewVersion: row.review_version,
  claimToken: row.claim_token == null ? null : String(row.claim_token),
  claimExpiresAt: row.claim_expires_at ?? null,
  checklistVersion: row.checklist_version ?? null,
  checklist: row.checklist,
});

const sdk = async () => getSdk(await getAPIServiceGraphqlClient());

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
  return row ? mapSubmission(row) : null;
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
  return row ? mapSubmission(row) : null;
};

export const releaseReviewSubmission = async (input: ClaimedWrite) => {
  const result = await (
    await sdk()
  ).ReleaseReviewSubmission(claimedVariables(input));
  const row = result.reviewer_release_app_review_submission[0];
  return row ? mapSubmission(row) : null;
};

export const saveReviewChecklist = async (
  input: ClaimedWrite & {
    checklistVersion: string;
    checklist: ReviewChecklist;
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
  return row ? mapSubmission(row) : null;
};
