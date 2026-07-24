/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetWorldIdAnalyticsActionDailiesQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
  source: Types.Scalars["String"]["input"];
  from: Types.Scalars["date"]["input"];
}>;

export type GetWorldIdAnalyticsActionDailiesQuery = {
  __typename?: "query_root";
  action_verification_stats_daily: Array<{
    __typename?: "action_verification_stats_daily";
    date: string;
    verifications: number;
    unique_verifications: number;
    repeated_verifications: number;
  }>;
};

export const GetWorldIdAnalyticsActionDailiesDocument = gql`
  query GetWorldIdAnalyticsActionDailies(
    $action_id: String!
    $source: String!
    $from: date!
  ) {
    action_verification_stats_daily(
      where: {
        action_id: { _eq: $action_id }
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
    GetWorldIdAnalyticsActionDailies(
      variables: GetWorldIdAnalyticsActionDailiesQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsActionDailiesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsActionDailiesQuery>(
            GetWorldIdAnalyticsActionDailiesDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsActionDailies",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
