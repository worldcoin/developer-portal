/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type VerifyAppMutationVariables = Types.Exact<{
  idToVerify: Types.Scalars["String"];
  idToDelete: Types.Scalars["String"];
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
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
