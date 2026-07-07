/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type RemoveAppFromReviewMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
}>;

export type RemoveAppFromReviewMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const RemoveAppFromReviewDocument = gql`
  mutation RemoveAppFromReview($app_metadata_id: String!) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: { verification_status: "unverified" }
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
    RemoveAppFromReview(
      variables: RemoveAppFromReviewMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<RemoveAppFromReviewMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<RemoveAppFromReviewMutation>(
            RemoveAppFromReviewDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "RemoveAppFromReview",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
