/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type ReopenChangesRequestedReviewDraftMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  expected_verification_status: Types.Scalars["String"]["input"];
  expected_metadata_updated_at: Types.Scalars["timestamptz"]["input"];
  actor_subject: Types.Scalars["String"]["input"];
  actor_email?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type ReopenChangesRequestedReviewDraftMutation = {
  __typename?: "mutation_root";
  reopen_changes_requested_review_draft: Array<{
    __typename?: "app_metadata";
    id: string;
    verification_status: string;
    updated_at: string;
  }>;
};

export const ReopenChangesRequestedReviewDraftDocument = gql`
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
    ReopenChangesRequestedReviewDraft(
      variables: ReopenChangesRequestedReviewDraftMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ReopenChangesRequestedReviewDraftMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ReopenChangesRequestedReviewDraftMutation>(
            ReopenChangesRequestedReviewDraftDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "ReopenChangesRequestedReviewDraft",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
