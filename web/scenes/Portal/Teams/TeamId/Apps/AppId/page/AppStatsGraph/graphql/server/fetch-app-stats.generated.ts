/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type FetchAppStatsQueryVariables = Types.Exact<{
  appId: Types.Scalars["String"]["input"];
  startsAt: Types.Scalars["timestamptz"]["input"];
  timeSpan: Types.Scalars["String"]["input"];
}>;

export type FetchAppStatsQuery = {
  __typename?: "query_root";
  app_stats: Array<{
    __typename?: "app_stats_returning";
    app_id: string;
    date: string;
    verifications: number;
    unique_users: number;
  }>;
  app: Array<{ __typename?: "app"; id: string; engine: string }>;
};

export const FetchAppStatsDocument = gql`
  query FetchAppStats(
    $appId: String!
    $startsAt: timestamptz!
    $timeSpan: String!
  ) {
    app_stats(
      args: { appId: $appId, startsAt: $startsAt, timespan: $timeSpan }
    ) {
      app_id
      date
      verifications
      unique_users
    }
    app(where: { id: { _eq: $appId } }) {
      id
      engine
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
    FetchAppStats(
      variables: FetchAppStatsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<FetchAppStatsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<FetchAppStatsQuery>(FetchAppStatsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        "FetchAppStats",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
