/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient } from "graphql-request";
import { GraphQLClientRequestHeaders } from "graphql-request/build/cjs/types";
import gql from "graphql-tag";
export type GetAppRankingsQueryVariables = Types.Exact<{
  platform: Types.Scalars["String"];
  country: Types.Scalars["String"];
}>;

export type GetAppRankingsQuery = {
  __typename?: "query_root";
  app_rankings: Array<{
    __typename?: "app_rankings";
    rankings?: Array<string> | null;
  }>;
  default_app_rankings: Array<{
    __typename?: "app_rankings";
    rankings?: Array<string> | null;
  }>;
  featured_app_rankings: Array<{
    __typename?: "app_rankings";
    rankings?: Array<string> | null;
  }>;
};

export const GetAppRankingsDocument = gql`
  query GetAppRankings($platform: String!, $country: String!) {
    app_rankings(
      where: { platform: { _eq: $platform }, country: { _eq: $country } }
    ) {
      rankings
    }
    default_app_rankings: app_rankings(
      where: { platform: { _eq: $platform }, country: { _eq: "default" } }
    ) {
      rankings
    }
    featured_app_rankings: app_rankings(
      where: { platform: { _eq: "web" }, country: { _eq: "featured" } }
    ) {
      rankings
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    GetAppRankings(
      variables: GetAppRankingsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetAppRankingsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAppRankingsQuery>(
            GetAppRankingsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetAppRankings",
        "query",
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
