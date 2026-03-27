/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type DeleteActionV4MutationVariables = Types.Exact<{
  id: Types.Scalars["String"]["input"];
}>;

export type DeleteActionV4Mutation = {
  __typename?: "mutation_root";
  delete_action_v4_by_pk?: { __typename?: "action_v4"; id: string } | null;
};

export const DeleteActionV4Document = gql`
  mutation DeleteActionV4($id: String!) {
    delete_action_v4_by_pk(id: $id) {
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
    DeleteActionV4(
      variables: DeleteActionV4MutationVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<DeleteActionV4Mutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<DeleteActionV4Mutation>(
            DeleteActionV4Document,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "DeleteActionV4",
        "mutation",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
