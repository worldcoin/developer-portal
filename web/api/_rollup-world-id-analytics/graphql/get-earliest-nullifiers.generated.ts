/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetEarliestNullifiersQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type GetEarliestNullifiersQuery = {
  __typename?: "query_root";
  nullifier: Array<{ __typename?: "nullifier"; created_at: string }>;
  nullifier_v4: Array<{ __typename?: "nullifier_v4"; created_at: string }>;
};

export const GetEarliestNullifiersDocument = gql`
  query GetEarliestNullifiers {
    nullifier(order_by: { created_at: asc }, limit: 1) {
      created_at
    }
    nullifier_v4(order_by: { created_at: asc }, limit: 1) {
      created_at
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
    GetEarliestNullifiers(
      variables?: GetEarliestNullifiersQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetEarliestNullifiersQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetEarliestNullifiersQuery>(
            GetEarliestNullifiersDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetEarliestNullifiers",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
