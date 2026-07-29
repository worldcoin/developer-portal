/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchUserQueryVariables = Types.Exact<{
  userId: Types.Scalars["String"]["input"];
}>;

export type FetchUserQuery = {
  __typename?: "query_root";
  user_by_pk?: { __typename?: "user"; id: string } | null;
};

export const FetchUserDocument = gql`
  query FetchUser($userId: String!) {
    user_by_pk(id: $userId) {
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
    FetchUser(
      variables: FetchUserQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchUserQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchUserQuery>(FetchUserDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "FetchUser",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
