/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertNullifierV4MutationVariables = Types.Exact<{
  action_v4_id: Types.Scalars["String"]["input"];
  nullifier: Types.Scalars["String"]["input"];
}>;

export type InsertNullifierV4Mutation = {
  __typename?: "mutation_root";
  insert_nullifier_v4_one?: {
    __typename?: "nullifier_v4";
    id: string;
    nullifier: string;
    action_v4_id: string;
    created_at: string;
  } | null;
};

export const InsertNullifierV4Document = gql`
  mutation InsertNullifierV4($action_v4_id: String!, $nullifier: String!) {
    insert_nullifier_v4_one(
      object: { action_v4_id: $action_v4_id, nullifier: $nullifier }
    ) {
      id
      nullifier
      action_v4_id
      created_at
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
    InsertNullifierV4(
      variables: InsertNullifierV4MutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertNullifierV4Mutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertNullifierV4Mutation>(
            InsertNullifierV4Document,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertNullifierV4",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
