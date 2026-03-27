/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertActionV4MutationVariables = Types.Exact<{
  object: Types.Action_V4_Insert_Input;
}>;

export type InsertActionV4Mutation = {
  __typename?: "mutation_root";
  insert_action_v4_one?: {
    __typename?: "action_v4";
    id: string;
    action: string;
    description: string;
    environment: unknown;
  } | null;
};

export const InsertActionV4Document = gql`
  mutation InsertActionV4($object: action_v4_insert_input!) {
    insert_action_v4_one(object: $object) {
      id
      action
      description
      environment
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
    InsertActionV4(
      variables: InsertActionV4MutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertActionV4Mutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertActionV4Mutation>(
            InsertActionV4Document,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertActionV4",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
