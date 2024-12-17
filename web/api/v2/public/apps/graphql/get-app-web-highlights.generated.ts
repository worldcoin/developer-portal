/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetRankingsQueryVariables = Types.Exact<{ [key: string]: never }>;

export type GetRankingsQuery = {
  __typename?: "query_root";
  app_rankings: Array<{
    __typename?: "app_rankings";
    rankings?: Array<string> | null;
  }>;
};

export const GetRankingsDocument = gql`
  query GetRankings {
    app_rankings(
      where: { platform: { _eq: "app" }, country: { _eq: "featured" } }
    ) {
      rankings
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
    GetRankings(
      variables?: GetRankingsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetRankingsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetRankingsQuery>(GetRankingsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetRankings",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
