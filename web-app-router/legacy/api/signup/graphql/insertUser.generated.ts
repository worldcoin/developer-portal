/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type InsertUserMutationVariables = Types.Exact<{
  user_data: Types.User_Insert_Input;
}>;

export type InsertUserMutation = {
  __typename?: "mutation_root";
  insert_user_one?: { __typename?: "user"; id: string } | null;
};

export const InsertUserDocument = gql`
  mutation InsertUser($user_data: user_insert_input!) {
    insert_user_one(object: $user_data) {
      id
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
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
