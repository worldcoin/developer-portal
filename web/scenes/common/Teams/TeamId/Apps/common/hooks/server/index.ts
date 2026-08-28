"use server";

import { errorFormAction } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { auth0 } from "@/lib/auth0";
import { getIsUserAllowedToUpdateVerificationStatus } from "@/lib/permissions";
import { extractIdsFromPath, getPathFromHeaders } from "@/lib/server-utils";
import { FormActionResult } from "@/lib/types";
import gql from "graphql-tag";

type ReviewRemovalExpectation = {
  expectedVerificationStatus: "awaiting_review" | "changes_requested";
  expectedMetadataUpdatedAt: string;
};

type ReviewWithdrawalContext = {
  id: string;
  app_mode: string;
  is_developer_allow_listing: boolean;
  verification_status: string;
  updated_at: string;
  review_submissions: Array<{
    id: string;
    review_version: number;
    status: string;
  }>;
};

const FetchDeveloperReviewWithdrawalContext = gql`
  query FetchDeveloperReviewWithdrawalContext($app_metadata_id: String!) {
    app_metadata_by_pk(id: $app_metadata_id) {
      id
      app_mode
      is_developer_allow_listing
      verification_status
      updated_at
      review_submissions(
        where: {
          status: { _in: ["pending", "in_review", "changes_requested"] }
        }
        order_by: { attempt: desc }
        limit: 1
      ) {
        id
        review_version
        status
      }
    }
  }
`;

const WithdrawActiveReviewDraft = gql`
  mutation WithdrawActiveReviewDraft(
    $app_metadata_id: String!
    $expected_metadata_updated_at: timestamptz!
    $expected_submission_id: uuid
    $expected_review_version: Int
    $actor_subject: String!
    $actor_email: String
  ) {
    developer_withdraw_active_review_draft(
      args: {
        p_app_metadata_id: $app_metadata_id
        p_expected_metadata_updated_at: $expected_metadata_updated_at
        p_expected_submission_id: $expected_submission_id
        p_expected_review_version: $expected_review_version
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      verification_status
      updated_at
    }
  }
`;

const ReopenChangesRequestedReviewDraft = gql`
  mutation ReopenChangesRequestedReviewDraft(
    $app_metadata_id: String!
    $expected_verification_status: String!
    $expected_metadata_updated_at: timestamptz!
    $actor_subject: String!
    $actor_email: String
  ) {
    reopen_changes_requested_review_draft(
      args: {
        p_app_metadata_id: $app_metadata_id
        p_expected_verification_status: $expected_verification_status
        p_expected_metadata_updated_at: $expected_metadata_updated_at
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      verification_status
      updated_at
    }
  }
`;

const invalidReviewState = ({
  teamId,
  appId,
}: {
  teamId?: string;
  appId?: string;
}) =>
  errorFormAction({
    message: "This review changed after the page loaded. Refresh and retry.",
    team_id: teamId,
    app_id: appId,
    logLevel: "warn",
    code: "VALIDATION_ERROR",
  });

export async function removeAppFromReview(
  app_metadata_id: string,
  expected: ReviewRemovalExpectation,
): Promise<FormActionResult> {
  const path = (await getPathFromHeaders()) || "";
  const { Apps: appId, Teams: teamId } = extractIdsFromPath(path, [
    "Apps",
    "Teams",
  ]);

  try {
    const isUserAllowedToUpdateVerificationStatus =
      await getIsUserAllowedToUpdateVerificationStatus(app_metadata_id);

    if (!isUserAllowedToUpdateVerificationStatus) {
      return errorFormAction({
        message:
          "The user does not have permission to remove this app from review",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
        code: "FORBIDDEN",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    const session = await auth0.getSession();
    const actorSubject = session?.user.sub;
    if (!actorSubject) {
      return errorFormAction({
        message: "Your session expired. Sign in and try again.",
        team_id: teamId,
        app_id: appId,
        logLevel: "warn",
        code: "AUTH_EXPIRED",
      });
    }

    if (
      !expected ||
      !["awaiting_review", "changes_requested"].includes(
        expected.expectedVerificationStatus,
      ) ||
      !Number.isFinite(Date.parse(expected.expectedMetadataUpdatedAt))
    ) {
      return invalidReviewState({ teamId, appId });
    }

    const fetchContext = async () => {
      const result = await client.request<{
        app_metadata_by_pk: ReviewWithdrawalContext | null;
      }>(FetchDeveloperReviewWithdrawalContext, { app_metadata_id });
      return result.app_metadata_by_pk;
    };
    const context = await fetchContext();
    if (
      !context ||
      context.verification_status !== expected.expectedVerificationStatus ||
      context.updated_at !== expected.expectedMetadataUpdatedAt
    ) {
      return invalidReviewState({ teamId, appId });
    }

    const mutationVariables = {
      app_metadata_id,
      actor_subject: actorSubject,
      actor_email: session?.user.email ?? null,
    };
    let transitioned = false;
    try {
      if (context.verification_status === "changes_requested") {
        const result = await client.request<{
          reopen_changes_requested_review_draft: Array<{ id: string }>;
        }>(ReopenChangesRequestedReviewDraft, {
          ...mutationVariables,
          expected_verification_status: "changes_requested",
          expected_metadata_updated_at: context.updated_at,
        });
        transitioned =
          result.reopen_changes_requested_review_draft.length === 1;
      } else {
        const activeSubmission = context.review_submissions.find((submission) =>
          ["pending", "in_review"].includes(submission.status),
        );
        const result = await client.request<{
          developer_withdraw_active_review_draft: Array<{ id: string }>;
        }>(WithdrawActiveReviewDraft, {
          ...mutationVariables,
          expected_metadata_updated_at: context.updated_at,
          expected_submission_id: activeSubmission?.id ?? null,
          expected_review_version: activeSubmission?.review_version ?? null,
        });
        transitioned =
          result.developer_withdraw_active_review_draft.length === 1;
      }
    } catch (error) {
      // A mutation response can be lost after commit. Reconcile only the exact
      // metadata row so retries do not report a committed withdrawal as failed.
      try {
        transitioned =
          (await fetchContext())?.verification_status === "unverified";
      } catch {
        throw error;
      }
      if (!transitioned) throw error;
    }

    if (!transitioned) return invalidReviewState({ teamId, appId });

    return {
      success: true,
      message: "App removed from review successfully",
    };
  } catch (error) {
    return errorFormAction({
      error: error as Error,
      message: "An error occurred while removing the app from review",
      additionalInfo: { app_metadata_id },
      team_id: teamId,
      app_id: appId,
      logLevel: "error",
      code: "UNKNOWN",
    });
  }
}
