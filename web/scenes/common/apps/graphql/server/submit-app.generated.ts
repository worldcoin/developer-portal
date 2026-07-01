/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type SubmitAppMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  verification_status: Types.Scalars["String"]["input"];
  is_developer_allow_listing: Types.Scalars["Boolean"]["input"];
  changelog: Types.Scalars["String"]["input"];
}>;

export type SubmitAppMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const SubmitAppDocument = gql`
  mutation SubmitApp(
    $app_metadata_id: String!
    $verification_status: String!
    $is_developer_allow_listing: Boolean!
    $changelog: String!
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: {
        verification_status: $verification_status
        is_developer_allow_listing: $is_developer_allow_listing
        changelog: $changelog
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
    SubmitApp(
      variables: SubmitAppMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<SubmitAppMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<SubmitAppMutation>(SubmitAppDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "SubmitApp",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
