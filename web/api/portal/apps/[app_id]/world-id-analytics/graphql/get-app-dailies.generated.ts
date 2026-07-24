/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetWorldIdAnalyticsAppDailiesQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  source: Types.Scalars["String"]["input"];
  from: Types.Scalars["date"]["input"];
}>;

export type GetWorldIdAnalyticsAppDailiesQuery = {
  __typename?: "query_root";
  app_verification_stats_daily: Array<{
    __typename?: "app_verification_stats_daily";
    date: string;
    verifications: number;
    unique_verifications: number;
    repeated_verifications: number;
  }>;
};

export const GetWorldIdAnalyticsAppDailiesDocument = gql`
  query GetWorldIdAnalyticsAppDailies(
    $app_id: String!
    $source: String!
    $from: date!
  ) {
    app_verification_stats_daily(
      where: {
        app_id: { _eq: $app_id }
        source: { _eq: $source }
        environment: { _eq: "production" }
        date: { _gte: $from }
      }
      order_by: [{ date: asc }]
    ) {
      date
      verifications
      unique_verifications
      repeated_verifications
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
    GetWorldIdAnalyticsAppDailies(
      variables: GetWorldIdAnalyticsAppDailiesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsAppDailiesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsAppDailiesQuery>(
            GetWorldIdAnalyticsAppDailiesDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsAppDailies",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
