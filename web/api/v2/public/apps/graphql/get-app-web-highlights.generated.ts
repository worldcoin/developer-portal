/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetHighlightsQueryVariables = Types.Exact<{ [key: string]: never }>;

export type GetHighlightsQuery = {
  __typename?: "query_root";
  app_rankings: Array<{
    __typename?: "app_rankings";
    rankings?: Array<string> | null;
  }>;
};

export const GetHighlightsDocument = gql`
  query GetHighlights {
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
    GetHighlights(
      variables?: GetHighlightsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetHighlightsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetHighlightsQuery>(GetHighlightsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "GetHighlights",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
