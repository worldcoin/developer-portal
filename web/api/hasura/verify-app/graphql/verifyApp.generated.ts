/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type VerifyAppMutationVariables = Types.Exact<{
  idToVerify: Types.Scalars["String"]["input"];
  idToDelete: Types.Scalars["String"]["input"];
  verified_data_changes?: Types.InputMaybe<Types.App_Metadata_Set_Input>;
}>;

export type VerifyAppMutation = {
  __typename?: "mutation_root";
  delete_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const VerifyAppDocument = gql`
  mutation verifyApp(
    $idToVerify: String!
    $idToDelete: String!
    $verified_data_changes: app_metadata_set_input
  ) {
    delete_app_metadata_by_pk(id: $idToDelete) {
      id
    }
    update_app_metadata_by_pk(
      pk_columns: { id: $idToVerify }
      _set: $verified_data_changes
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
    verifyApp(
      variables: VerifyAppMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<VerifyAppMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<VerifyAppMutation>(VerifyAppDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "verifyApp",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
