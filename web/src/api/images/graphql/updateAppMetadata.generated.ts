/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type UpdateAppMetadataMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
  verified_data_changes?: Types.InputMaybe<Types.App_Metadata_Set_Input>;
}>;

export type UpdateAppMetadataMutation = {
  __typename?: "mutation_root";
  update_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const UpdateAppMetadataDocument = gql`
  mutation UpdateAppMetadata(
    $id: String!
    $verified_data_changes: app_metadata_set_input
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $id }
      _set: $verified_data_changes
    ) {
      id
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper
) {
  return {
    UpdateAppMetadata(
      variables: UpdateAppMetadataMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<UpdateAppMetadataMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateAppMetadataMutation>(
            UpdateAppMetadataDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "UpdateAppMetadata",
        "mutation"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
