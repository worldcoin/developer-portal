/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type McpSubmitAppForReviewMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  is_developer_allow_listing: Types.Scalars["Boolean"]["input"];
  changelog: Types.Scalars["String"]["input"];
}>;

export type McpSubmitAppForReviewMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
    app_id: string;
    verification_status: string;
    is_developer_allow_listing: boolean;
  } | null;
};

export const McpSubmitAppForReviewDocument = gql`
  mutation McpSubmitAppForReview(
    $app_metadata_id: String!
    $is_developer_allow_listing: Boolean!
    $changelog: String!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: {
        verification_status: "awaiting_review"
        is_developer_allow_listing: $is_developer_allow_listing
        changelog: $changelog
      }
    ) {
      id
      app_id
      verification_status
      is_developer_allow_listing
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
    McpSubmitAppForReview(
      variables: McpSubmitAppForReviewMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<McpSubmitAppForReviewMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<McpSubmitAppForReviewMutation>(
            McpSubmitAppForReviewDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "McpSubmitAppForReview",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
