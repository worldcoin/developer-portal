/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type InsertAppMutationVariables = Types.Exact<{
  object: Types.App_Insert_Input;
}>;

export type InsertAppMutation = {
  __typename?: "mutation_root";
  insert_app_one?: { __typename?: "app"; id: string } | null;
};

export const InsertAppDocument = gql`
  mutation InsertApp($object: app_insert_input!) {
    insert_app_one(object: $object) {
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
    InsertApp(
      variables: InsertAppMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertAppMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertAppMutation>(InsertAppDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "InsertApp",
        "mutation",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
