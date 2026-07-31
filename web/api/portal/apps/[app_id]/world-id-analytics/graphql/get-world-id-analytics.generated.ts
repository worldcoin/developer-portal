/* eslint-disable import/no-relative-parent-imports -- auto generated file */
import * as Types from "@/graphql/graphql";

import { GraphQLClient, RequestOptions } from "graphql-request";
import gql from "graphql-tag";
type GraphQLClientRequestHeaders = RequestOptions["requestHeaders"];
export type GetWorldIdAnalyticsScopeQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  action_ids:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
}>;

export type GetWorldIdAnalyticsScopeQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    created_at: string;
    is_staging: boolean;
    rp_registration: Array<{
      __typename?: "rp_registration";
      rp_id: string;
      created_at: string;
    }>;
  }>;
  legacy_actions: Array<{
    __typename?: "action";
    id: string;
    app_id: string;
    created_at: string;
  }>;
  actions: Array<{
    __typename?: "action_v4";
    id: string;
    rp_id: string;
    environment: unknown;
    created_at: string;
  }>;
  has_v3_history: Array<{
    __typename?: "action_v3_stats_daily";
    date_utc: string;
  }>;
};

export type GetWorldIdAnalyticsAppDailyQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  environment: Types.Scalars["String"]["input"];
  from: Types.Scalars["date"]["input"];
  through: Types.Scalars["date"]["input"];
}>;

export type GetWorldIdAnalyticsAppDailyQuery = {
  __typename?: "query_root";
  world_id_app_stats_daily: Array<{
    __typename?: "world_id_app_stats_daily";
    date_utc: string;
    unique_count: number;
  }>;
};

export type GetWorldIdAnalyticsActionDailyQueryVariables = Types.Exact<{
  legacy_ids:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
  action_ids:
    | Array<Types.Scalars["String"]["input"]>
    | Types.Scalars["String"]["input"];
  from: Types.Scalars["date"]["input"];
  through: Types.Scalars["date"]["input"];
}>;

export type GetWorldIdAnalyticsActionDailyQuery = {
  __typename?: "query_root";
  action_v3_stats_daily: Array<{
    __typename?: "action_v3_stats_daily";
    action_id: string;
    date_utc: string;
    unique_count: number;
  }>;
  action_v4_stats_daily: Array<{
    __typename?: "action_v4_stats_daily";
    action_v4_id: string;
    date_utc: string;
    unique_count: number;
  }>;
};

export const GetWorldIdAnalyticsScopeDocument = gql`
  query GetWorldIdAnalyticsScope($app_id: String!, $action_ids: [String!]!) {
    app(where: { id: { _eq: $app_id }, deleted_at: { _is_null: true } }) {
      id
      created_at
      is_staging
      rp_registration {
        rp_id
        created_at
      }
    }
    legacy_actions: action(where: { id: { _in: $action_ids } }) {
      id
      app_id
      created_at
    }
    actions: action_v4(where: { id: { _in: $action_ids } }) {
      id
      rp_id
      environment
      created_at
    }
    has_v3_history: action_v3_stats_daily(
      limit: 1
      where: { action: { app_id: { _eq: $app_id } } }
    ) {
      date_utc
    }
  }
`;
export const GetWorldIdAnalyticsAppDailyDocument = gql`
  query GetWorldIdAnalyticsAppDaily(
    $app_id: String!
    $environment: String!
    $from: date!
    $through: date!
  ) {
    world_id_app_stats_daily: world_id_analytics_app_daily(
      args: {
        app_id_input: $app_id
        environment_input: $environment
        from_date_input: $from
        through_date_input: $through
      }
    ) {
      date_utc
      unique_count
    }
  }
`;
export const GetWorldIdAnalyticsActionDailyDocument = gql`
  query GetWorldIdAnalyticsActionDaily(
    $legacy_ids: [String!]!
    $action_ids: [String!]!
    $from: date!
    $through: date!
  ) {
    action_v3_stats_daily(
      where: {
        action_id: { _in: $legacy_ids }
        date_utc: { _gte: $from, _lte: $through }
      }
    ) {
      action_id
      date_utc
      unique_count
    }
    action_v4_stats_daily(
      where: {
        action_v4_id: { _in: $action_ids }
        date_utc: { _gte: $from, _lte: $through }
      }
    ) {
      action_v4_id
      date_utc
      unique_count
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
    GetWorldIdAnalyticsScope(
      variables: GetWorldIdAnalyticsScopeQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsScopeQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsScopeQuery>(
            GetWorldIdAnalyticsScopeDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsScope",
        "query",
        variables,
      );
    },
    GetWorldIdAnalyticsAppDaily(
      variables: GetWorldIdAnalyticsAppDailyQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsAppDailyQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsAppDailyQuery>(
            GetWorldIdAnalyticsAppDailyDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsAppDaily",
        "query",
        variables,
      );
    },
    GetWorldIdAnalyticsActionDaily(
      variables: GetWorldIdAnalyticsActionDailyQueryVariables,
      requestHeaders?: GraphQLClientRequestHeaders,
    ): Promise<GetWorldIdAnalyticsActionDailyQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetWorldIdAnalyticsActionDailyQuery>(
            GetWorldIdAnalyticsActionDailyDocument,
            variables,
            { ...requestHeaders, ...wrappedRequestHeaders },
          ),
        "GetWorldIdAnalyticsActionDaily",
        "query",
        variables,
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
