/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteUserMutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type DeleteUserMutation = {
  __typename?: "mutation_root";
  delete_user_by_pk?: { __typename?: "user"; id: string } | null;
};

export const DeleteUserDocument = gql`
  mutation DeleteUser($id: String!) {
    delete_user_by_pk(id: $id) {
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
    DeleteUser(
      variables: DeleteUserMutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteUserMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteUserMutation>(DeleteUserDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "DeleteUser",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
