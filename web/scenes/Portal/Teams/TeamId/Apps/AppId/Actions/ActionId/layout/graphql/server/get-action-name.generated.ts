/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetActionNameQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
}>;

export type GetActionNameQuery = {
  __typename?: "query_root";
  action_by_pk?: { __typename?: "action"; id: string; name: string } | null;
};

export const GetActionNameDocument = gql`
  query GetActionName($action_id: String!) {
    action_by_pk(id: $action_id) {
      id
      name
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
    GetActionName(
      variables: GetActionNameQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetActionNameQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetActionNameQuery>(GetActionNameDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetActionName",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
