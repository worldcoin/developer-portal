/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type AtomicUpsertNullifierMutationVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
  nullifier_hash: Types.Scalars["String"]["input"];
  nullifier_hash_int: Types.Scalars["String"]["input"];
}>;

export type AtomicUpsertNullifierMutation = {
  __typename?: "mutation_root";
  insert_nullifier_one?: {
    __typename?: "nullifier";
    nullifier_hash: string;
    nullifier_hash_int?: string | null;
  } | null;
  update_nullifier?: {
    __typename?: "nullifier_mutation_response";
    affected_rows: number;
    returning: Array<{
      __typename?: "nullifier";
      uses: number;
      created_at: string;
      nullifier_hash: string;
      nullifier_hash_int?: string | null;
    }>;
  } | null;
};

export const AtomicUpsertNullifierDocument = gql`
  mutation AtomicUpsertNullifier(
    $action_id: String!
    $nullifier_hash: String!
    $nullifier_hash_int: String!
  ) {
    insert_nullifier_one(
      object: {
        action_id: $action_id
        nullifier_hash: $nullifier_hash
        nullifier_hash_int: $nullifier_hash_int
        uses: 0
      }
      on_conflict: { constraint: unique_nullifier_hash, update_columns: [] }
    ) {
      nullifier_hash
      nullifier_hash_int
    }
    update_nullifier(
      where: { nullifier_hash_int: { _eq: $nullifier_hash_int } }
      _inc: { uses: 1 }
    ) {
      affected_rows
      returning {
        uses
        created_at
        nullifier_hash
        nullifier_hash_int
      }
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
    AtomicUpsertNullifier(
      variables: AtomicUpsertNullifierMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<AtomicUpsertNullifierMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<AtomicUpsertNullifierMutation>(
            AtomicUpsertNullifierDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "AtomicUpsertNullifier",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
