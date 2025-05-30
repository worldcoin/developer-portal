/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type ApiKeyQueryQueryVariables = Types.Exact<{
  key_id: Types.Scalars["String"]["input"];
}>;

export type ApiKeyQueryQuery = {
  __typename?: "query_root";
  api_key: Array<{
    __typename?: "api_key";
    id: string;
    team_id: string;
    api_key: string;
  }>;
};

export const ApiKeyQueryDocument = gql`
  query ApiKeyQuery($key_id: String!) {
    api_key(where: { id: { _eq: $key_id }, is_active: { _eq: true } }) {
      id
      team_id
      api_key
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
    ApiKeyQuery(
      variables: ApiKeyQueryQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<ApiKeyQueryQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<ApiKeyQueryQuery>(ApiKeyQueryDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "ApiKeyQuery",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
