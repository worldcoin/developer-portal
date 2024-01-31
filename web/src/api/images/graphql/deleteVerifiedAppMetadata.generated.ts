/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type DeleteVerifiedAppMetadataMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
}>;

export type DeleteVerifiedAppMetadataMutation = {
  __typename?: "mutation_root";
  delete_app_metadata_by_pk?: {
    __typename?: "app_metadata";
    id: string;
  } | null;
};

export const DeleteVerifiedAppMetadataDocument = gql`
  mutation DeleteVerifiedAppMetadata($id: String!) {
    delete_app_metadata_by_pk(id: $id) {
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
    DeleteVerifiedAppMetadata(
      variables: DeleteVerifiedAppMetadataMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders
    ): Promise<DeleteVerifiedAppMetadataMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteVerifiedAppMetadataMutation>(
            DeleteVerifiedAppMetadataDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders }
          ),
        "DeleteVerifiedAppMetadata",
        "mutation"
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
