/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetAppReviewQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  nullifier_hash: Types.Scalars["String"]["input"];
}>;

export type GetAppReviewQuery = {
  __typename?: "query_root";
  app_reviews: Array<{ __typename?: "app_reviews"; rating: number }>;
};

export const GetAppReviewDocument = gql`
  query GetAppReview($app_id: String!, $nullifier_hash: String!) {
    app_reviews(
      where: {
        nullifier_hash: { _eq: $nullifier_hash }
        app_id: { _eq: $app_id }
      }
    ) {
      rating
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
    GetAppReview(
      variables: GetAppReviewQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAppReviewQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppReviewQuery>(GetAppReviewDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetAppReview",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
