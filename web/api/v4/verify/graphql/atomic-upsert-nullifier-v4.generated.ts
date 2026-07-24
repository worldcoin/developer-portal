/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type AtomicUpsertNullifierV4MutationVariables = Types.Exact<{
  action_v4_id: Types.Scalars["String"]["input"];
  nullifier: Types.Scalars["numeric"]["input"];
}>;

export type AtomicUpsertNullifierV4Mutation = {
  __typename?: "mutation_root";
  insert_nullifier_v4_one?: { __typename?: "nullifier_v4"; id: string } | null;
  update_nullifier_v4?: {
    __typename?: "nullifier_v4_mutation_response";
    affected_rows: number;
    returning: Array<{
      __typename?: "nullifier_v4";
      id: string;
      uses: number;
      created_at: string;
      updated_at: string;
    }>;
  } | null;
};

export const AtomicUpsertNullifierV4Document = gql`
  mutation AtomicUpsertNullifierV4(
    $action_v4_id: String!
    $nullifier: numeric!
  ) {
    insert_nullifier_v4_one(
      object: { action_v4_id: $action_v4_id, nullifier: $nullifier, uses: 0 }
      on_conflict: {
        constraint: nullifier_v4_nullifier_key
        update_columns: []
      }
    ) {
      id
    }
    update_nullifier_v4(
      where: {
        nullifier: { _eq: $nullifier }
        action_v4_id: { _eq: $action_v4_id }
      }
      _inc: { uses: 1 }
    ) {
      affected_rows
      returning {
        id
        uses
        created_at
        updated_at
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
    AtomicUpsertNullifierV4(
      variables: AtomicUpsertNullifierV4MutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<AtomicUpsertNullifierV4Mutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<AtomicUpsertNullifierV4Mutation>(
            AtomicUpsertNullifierV4Document,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "AtomicUpsertNullifierV4",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
