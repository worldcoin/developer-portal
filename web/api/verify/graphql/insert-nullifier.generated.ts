/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type InsertNullifierMutationVariables = Types.Exact<{
  action_id: Types.Scalars["String"];
  nullifier_hash: Types.Scalars["String"];
}>;

export type InsertNullifierMutation = {
  __typename?: "mutation_root";
  insert_nullifier_one?: {
    __typename?: "nullifier";
    created_at: any;
    nullifier_hash: string;
  } | null;
};

export const InsertNullifierDocument = gql`
  mutation InsertNullifier($action_id: String!, $nullifier_hash: String!) {
    insert_nullifier_one(
      object: { action_id: $action_id, nullifier_hash: $nullifier_hash }
    ) {
      created_at
      nullifier_hash
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
    InsertNullifier(
      variables: InsertNullifierMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertNullifierMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertNullifierMutation>(
            InsertNullifierDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertNullifier",
        "mutation",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
