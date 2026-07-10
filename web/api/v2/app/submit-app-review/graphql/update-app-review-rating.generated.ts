/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateAppReviewRatingMutationVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  nullifier_hash: Types.Scalars["String"]["input"];
  rating: Types.Scalars["Int"]["input"];
}>;

export type UpdateAppReviewRatingMutation = {
  __typename?: "mutation_root";
  update_app_reviews?: {
    __typename?: "app_reviews_mutation_response";
    affected_rows: number;
  } | null;
};

export const UpdateAppReviewRatingDocument = gql`
  mutation UpdateAppReviewRating(
    $app_id: String!
    $nullifier_hash: String!
    $rating: Int!
  ) {
    update_app_reviews(
      where: {
        app_id: { _eq: $app_id }
        nullifier_hash: { _eq: $nullifier_hash }
      }
      _set: { rating: $rating }
    ) {
      affected_rows
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
    UpdateAppReviewRating(
      variables: UpdateAppReviewRatingMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateAppReviewRatingMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateAppReviewRatingMutation>(
            UpdateAppReviewRatingDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateAppReviewRating",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
