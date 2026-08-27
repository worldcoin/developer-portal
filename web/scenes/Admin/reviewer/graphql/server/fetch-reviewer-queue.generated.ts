/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchReviewerQueueQueryVariables = Types.Exact<{
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
  where: Types.App_Review_Submission_Bool_Exp;
}>;

export type FetchReviewerQueueQuery = {
  __typename?: "query_root";
  app_review_submission: Array<{
    __typename?: "app_review_submission";
    id: unknown;
    app_id: string;
    app_metadata_id: string;
    app_mode: string;
    attempt: number;
    changelog: string;
    claimed_by_email?: string | null;
    claim_expires_at?: string | null;
    listing_target: string;
    metadata_snapshot: any;
    review_version: number;
    status: string;
    submitted_at: string;
    app: { __typename?: "app"; name: string };
    team: { __typename?: "team"; id: string; name?: string | null };
  }>;
};

export const FetchReviewerQueueDocument = gql`
  query FetchReviewerQueue(
    $limit: Int!
    $offset: Int!
    $where: app_review_submission_bool_exp!
  ) {
    app_review_submission(
      limit: $limit
      offset: $offset
      where: $where
      order_by: [{ submitted_at: asc }, { id: asc }]
    ) {
      id
      app_id
      app_metadata_id
      app_mode
      attempt
      changelog
      claimed_by_email
      claim_expires_at
      listing_target
      metadata_snapshot
      review_version
      status
      submitted_at
      app {
        name
      }
      team {
        id
        name
      }
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
    FetchReviewerQueue(
      variables: FetchReviewerQueueQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchReviewerQueueQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchReviewerQueueQuery>(
            FetchReviewerQueueDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "FetchReviewerQueue",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
