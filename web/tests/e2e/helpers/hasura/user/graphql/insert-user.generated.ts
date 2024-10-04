/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertUserMutationVariables = Types.Exact<{
  object: Types.User_Insert_Input;
}>;

export type InsertUserMutation = {
  __typename?: "mutation_root";
  insert_user_one?: { __typename?: "user"; id: string } | null;
};

export const InsertUserDocument = gql`
  mutation InsertUser($object: user_insert_input!) {
    insert_user_one(object: $object) {
      id
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
    InsertUser(
      variables: InsertUserMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertUserMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertUserMutation>(InsertUserDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "InsertUser",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
