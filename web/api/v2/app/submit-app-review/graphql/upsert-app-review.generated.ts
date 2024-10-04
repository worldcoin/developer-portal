/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpsertAppReviewMutationVariables = Types.Exact<{
  nullifier_hash: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  country: Types.Scalars["String"]["input"];
  rating: Types.Scalars["Int"]["input"];
}>;

export type UpsertAppReviewMutation = {
  __typename?: "mutation_root";
  insert_app_reviews_one?: {
    __typename?: "app_reviews";
    id: string;
    app_id: string;
    country: string;
    rating: number;
  } | null;
};

export const UpsertAppReviewDocument = gql`
  mutation UpsertAppReview(
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
      on_conflict: {
        constraint: app_reviews_nullifier_hash_key
        update_columns: [rating]
      }
    ) {
      id
      app_id
      country
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
    UpsertAppReview(
      variables: UpsertAppReviewMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpsertAppReviewMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpsertAppReviewMutation>(
            UpsertAppReviewDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpsertAppReview",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
