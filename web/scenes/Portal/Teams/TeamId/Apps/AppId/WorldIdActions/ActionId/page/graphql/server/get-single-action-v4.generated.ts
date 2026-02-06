/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetSingleActionV4QueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
}>;

export type GetSingleActionV4Query = {
  __typename?: "query_root";
  action_v4_by_pk?: {
    __typename?: "action_v4";
    id: string;
    action: string;
  } | null;
};

export const GetSingleActionV4Document = gql`
  query GetSingleActionV4($action_id: String!) {
    action_v4_by_pk(id: $action_id) {
      id
      action
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
    GetSingleActionV4(
      variables: GetSingleActionV4QueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetSingleActionV4Query> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetSingleActionV4Query>(
            GetSingleActionV4Document,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetSingleActionV4",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
