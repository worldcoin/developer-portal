/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetWorldIdAnalyticsPageActionStatsQueryVariables = Types.Exact<{
  action_ids:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
  source: Types.Scalars["String"]["input"];
}>;

export type GetWorldIdAnalyticsPageActionStatsQuery = {
  __typename?: "query_root";
  action_verification_stats_total: Array<{
    __typename?: "action_verification_stats_total";
    action_id: string;
    verifications: number;
    unique_verifications: number;
    repeated_verifications: number;
    latest_verification_at?: string | null;
  }>;
};

export const GetWorldIdAnalyticsPageActionStatsDocument = gql`
  query GetWorldIdAnalyticsPageActionStats(
    $action_ids: [String!]!
    $source: String!
  ) {
    action_verification_stats_total(
      where: {
        action_id: { _in: $action_ids }
        source: { _eq: $source }
        environment: { _eq: "production" }
      }
    ) {
      action_id
      verifications
      unique_verifications
      repeated_verifications
      latest_verification_at
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
    GetWorldIdAnalyticsPageActionStats(
      variables: GetWorldIdAnalyticsPageActionStatsQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsPageActionStatsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsPageActionStatsQuery>(
            GetWorldIdAnalyticsPageActionStatsDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsPageActionStats",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
