/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type ClaimReviewSubmissionMutationVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
  expected_review_version: Types.Scalars["Int"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email: Types.Scalars["String"]["input"];
}>;

export type ClaimReviewSubmissionMutation = {
  __typename?: "mutation_root";
  reviewer_claim_app_review_submission: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    status: string;
    review_version: number;
    claim_token?: unknown | null;
    claim_expires_at?: string | null;
    checklist_version?: string | null;
    checklist: any;
  }>;
};

export type HeartbeatReviewSubmissionMutationVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
  claim_token: Types.Scalars["uuid"]["input"];
  expected_review_version: Types.Scalars["Int"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email: Types.Scalars["String"]["input"];
}>;

export type HeartbeatReviewSubmissionMutation = {
  __typename?: "mutation_root";
  reviewer_heartbeat_app_review_submission: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    status: string;
    review_version: number;
    claim_token?: unknown | null;
    claim_expires_at?: string | null;
    checklist_version?: string | null;
    checklist: any;
  }>;
};

export type ReleaseReviewSubmissionMutationVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
  claim_token: Types.Scalars["uuid"]["input"];
  expected_review_version: Types.Scalars["Int"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email: Types.Scalars["String"]["input"];
}>;

export type ReleaseReviewSubmissionMutation = {
  __typename?: "mutation_root";
  reviewer_release_app_review_submission: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    status: string;
    review_version: number;
    claim_token?: unknown | null;
    claim_expires_at?: string | null;
    checklist_version?: string | null;
    checklist: any;
  }>;
};

export type SaveReviewChecklistMutationVariables = Types.Exact<{
  submission_id: Types.Scalars["uuid"]["input"];
  claim_token: Types.Scalars["uuid"]["input"];
  expected_review_version: Types.Scalars["Int"]["input"];
  checklist_version: Types.Scalars["String"]["input"];
  checklist: Types.Scalars["jsonb"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email: Types.Scalars["String"]["input"];
}>;

export type SaveReviewChecklistMutation = {
  __typename?: "mutation_root";
  reviewer_save_app_review_checklist: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    status: string;
    review_version: number;
    claim_token?: unknown | null;
    claim_expires_at?: string | null;
    checklist_version?: string | null;
    checklist: any;
  }>;
};

export const ClaimReviewSubmissionDocument = gql`
  mutation ClaimReviewSubmission(
    $submission_id: uuid!
    $expected_review_version: Int!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_claim_app_review_submission(
      args: {
        p_submission_id: $submission_id
        p_expected_review_version: $expected_review_version
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
      review_version
      claim_token
      claim_expires_at
      checklist_version
      checklist
    }
  }
`;
export const HeartbeatReviewSubmissionDocument = gql`
  mutation HeartbeatReviewSubmission(
    $submission_id: uuid!
    $claim_token: uuid!
    $expected_review_version: Int!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_heartbeat_app_review_submission(
      args: {
        p_submission_id: $submission_id
        p_claim_token: $claim_token
        p_expected_review_version: $expected_review_version
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
      review_version
      claim_token
      claim_expires_at
      checklist_version
      checklist
    }
  }
`;
export const ReleaseReviewSubmissionDocument = gql`
  mutation ReleaseReviewSubmission(
    $submission_id: uuid!
    $claim_token: uuid!
    $expected_review_version: Int!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_release_app_review_submission(
      args: {
        p_submission_id: $submission_id
        p_claim_token: $claim_token
        p_expected_review_version: $expected_review_version
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
      review_version
      claim_token
      claim_expires_at
      checklist_version
      checklist
    }
  }
`;
export const SaveReviewChecklistDocument = gql`
  mutation SaveReviewChecklist(
    $submission_id: uuid!
    $claim_token: uuid!
    $expected_review_version: Int!
    $checklist_version: String!
    $checklist: jsonb!
    $actor_subject: String!
    $actor_email: String!
  ) {
    reviewer_save_app_review_checklist(
      args: {
        p_submission_id: $submission_id
        p_claim_token: $claim_token
        p_expected_review_version: $expected_review_version
        p_checklist_version: $checklist_version
        p_checklist: $checklist
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
      review_version
      claim_token
      claim_expires_at
      checklist_version
      checklist
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
  variables?: any,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
  _variables,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    ClaimReviewSubmission(
      variables: ClaimReviewSubmissionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ClaimReviewSubmissionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ClaimReviewSubmissionMutation>(
            ClaimReviewSubmissionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ClaimReviewSubmission",
        "mutation",
        variables,
      );
    },
    HeartbeatReviewSubmission(
      variables: HeartbeatReviewSubmissionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<HeartbeatReviewSubmissionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<HeartbeatReviewSubmissionMutation>(
            HeartbeatReviewSubmissionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "HeartbeatReviewSubmission",
        "mutation",
        variables,
      );
    },
    ReleaseReviewSubmission(
      variables: ReleaseReviewSubmissionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ReleaseReviewSubmissionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ReleaseReviewSubmissionMutation>(
            ReleaseReviewSubmissionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ReleaseReviewSubmission",
        "mutation",
        variables,
      );
    },
    SaveReviewChecklist(
      variables: SaveReviewChecklistMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<SaveReviewChecklistMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<SaveReviewChecklistMutation>(
            SaveReviewChecklistDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "SaveReviewChecklist",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
