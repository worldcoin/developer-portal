/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type InsertLayoutMutationVariables = Types.Exact<{
  layout: Types.Layout_Insert_Input;
}>;

export type InsertLayoutMutation = {
  __typename?: "mutation_root";
  insert_layout_one?: { __typename?: "layout"; id: string } | null;
};

export const InsertLayoutDocument = gql`
  mutation InsertLayout($layout: layout_insert_input!) {
    insert_layout_one(object: $layout) {
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
    InsertLayout(
      variables: InsertLayoutMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<InsertLayoutMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<InsertLayoutMutation>(
            InsertLayoutDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "InsertLayout",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
