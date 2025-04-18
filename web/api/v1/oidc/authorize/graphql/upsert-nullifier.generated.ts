/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type UpsertNullifierMutationVariables = Types.Exact<{
  object: Types.Nullifier_Insert_Input;
  on_conflict: Types.Nullifier_On_Conflict;
}>;

export type UpsertNullifierMutation = {
  __typename?: "mutation_root";
  insert_nullifier_one?: {
    __typename?: "nullifier";
    id: string;
    nullifier_hash: string;
  } | null;
};

export const UpsertNullifierDocument = gql`
  mutation UpsertNullifier(
    $object: nullifier_insert_input!
    $on_conflict: nullifier_on_conflict!
  ) {
    insert_nullifier_one(object: $object, on_conflict: $on_conflict) {
      id
      nullifier_hash
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
    UpsertNullifier(
      variables: UpsertNullifierMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<UpsertNullifierMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<UpsertNullifierMutation>(
            UpsertNullifierDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "UpsertNullifier",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
