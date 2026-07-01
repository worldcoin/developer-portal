/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpdateAppModeMutationVariables = Types.Exact<{
  app_metadata_id: Types.Scalars["String"]["input"];
  app_mode: Types.Scalars["String"]["input"];
}>;

export type UpdateAppModeMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateAppModeDocument = gql`
  mutation UpdateAppMode($app_metadata_id: String!, $app_mode: String!) {
    update_app_metadata_by_pk(
      pk_columns: { id: $app_metadata_id }
      _set: { app_mode: $app_mode }
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
