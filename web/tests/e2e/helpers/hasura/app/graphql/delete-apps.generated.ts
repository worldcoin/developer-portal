/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type DeleteAppsMutationVariables = Types.Exact<{
  where: Types.App_Bool_Exp;
}>;

export type DeleteAppsMutation = {
  __typename?: "mutation_root";
  delete_app?: {
    __typename?: "app_mutation_response";
    affected_rows: number;
  } | null;
};

export const DeleteAppsDocument = gql`
  mutation DeleteApps($where: app_bool_exp!) {
    delete_app(where: $where) {
      affected_rows
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
    DeleteApps(
      variables: DeleteAppsMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteAppsMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteAppsMutation>(DeleteAppsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "DeleteApps",
        "mutation",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
