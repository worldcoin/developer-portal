/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type UpdateApiKeyMutationVariables = Types.Exact<{
  id?: Types.InputMaybe<Types.Scalars["String"]>;
  hashed_secret?: Types.InputMaybe<Types.Scalars["String"]>;
}>;

export type UpdateApiKeyMutation = {
  __typename?: "mutation_root";
  update_api_key?: {
    __typename?: "api_key_mutation_response";
    affected_rows: number;
  } | null;
};

export const UpdateApiKeyDocument = gql`
  mutation UpdateAPIKey($id: String = "", $hashed_secret: String = "") {
    update_api_key(
      where: { id: { _eq: $id } }
      _set: { api_key: $hashed_secret }
    ) {
      affected_rows
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
    UpdateAPIKey(
      variables?: UpdateApiKeyMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpdateApiKeyMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpdateApiKeyMutation>(
            UpdateApiKeyDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpdateAPIKey",
        "mutation",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
