/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertAppReviewMutationVariables = Types.Exact<{
  nullifier_hash: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  country: Types.Scalars["String"]["input"];
  rating: Types.Scalars["Int"]["input"];
}>;

export type InsertAppReviewMutation = {
  __typename?: "mutation_root";
  insert_app_reviews_one?: { __typename?: "app_reviews"; id: string } | null;
};

export const InsertAppReviewDocument = gql`
  mutation InsertAppReview(
    $nullifier_hash: String!
    $app_id: String!
    $country: String!
    $rating: Int!
  ) {
    insert_app_reviews_one(
      object: {
        nullifier_hash: $nullifier_hash
        app_id: $app_id
        country: $country
        rating: $rating
      }
    ) {
      id
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
    InsertAppReview(
      variables: InsertAppReviewMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertAppReviewMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertAppReviewMutation>(
            InsertAppReviewDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertAppReview",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
