/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateAppModeMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  app_mode: Types.Scalars["String"]["input"];
  clear_external_category?: Types.InputMaybe<Types.Scalars["Boolean"]["input"]>;
}>;

export type UpdateAppModeMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
  cleared_external_category?: {
    __typename?: "app_metadata_mutation_response";
    affected_rows: number;
  } | null;
};

export const UpdateAppModeDocument = gql`
  mutation UpdateAppMode(
    $app_metadata_id: String!
    $app_mode: String!
    $clear_external_category: Boolean = false
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: { app_mode: $app_mode }
    ) {
      id
    }
    cleared_external_category: update_app_metadata(
      where: { id: { _eq: $app_metadata_id }, category: { _eq: "External" } }
      _set: { category: "Other" }
    ) @include(if: $clear_external_category) {
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
    UpdateAppMode(
      variables: UpdateAppModeMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateAppModeMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateAppModeMutation>(
            UpdateAppModeDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateAppMode",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
