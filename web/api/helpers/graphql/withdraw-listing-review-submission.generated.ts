/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type WithdrawListingReviewSubmissionMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  actor_subject?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
  actor_email?: Types.InputMaybe<Types.Scalars["String"]["input"]>;
}>;

export type WithdrawListingReviewSubmissionMutation = {
  __typename?: "mutation_root";
  withdraw_listing_review_submission: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    status: string;
  }>;
};

export const WithdrawListingReviewSubmissionDocument = gql`
  mutation WithdrawListingReviewSubmission(
    $app_metadata_id: String!
    $actor_subject: String
    $actor_email: String
  ) {
    withdraw_listing_review_submission(
      args: {
        p_app_metadata_id: $app_metadata_id
        p_actor_subject: $actor_subject
        p_actor_email: $actor_email
      }
    ) {
      id
      status
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
    WithdrawListingReviewSubmission(
      variables: WithdrawListingReviewSubmissionMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<WithdrawListingReviewSubmissionMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<WithdrawListingReviewSubmissionMutation>(
            WithdrawListingReviewSubmissionDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "WithdrawListingReviewSubmission",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
