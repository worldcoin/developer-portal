/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetUserByAuth0IdQueryVariables = Types.Exact<{
  auth0Id: Types.Scalars["String"]["input"];
}>;

export type GetUserByAuth0IdQuery = {
  __typename?: "query_root";
  user: Array<{ __typename?: "user"; id: string; posthog_id?: string | null }>;
};

export const GetUserByAuth0IdDocument = gql`
  query GetUserByAuth0Id($auth0Id: String!) {
    user(where: { auth0Id: { _eq: $auth0Id } }, limit: 1) {
      id
      posthog_id
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
    GetUserByAuth0Id(
      variables: GetUserByAuth0IdQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetUserByAuth0IdQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetUserByAuth0IdQuery>(
            GetUserByAuth0IdDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetUserByAuth0Id",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
