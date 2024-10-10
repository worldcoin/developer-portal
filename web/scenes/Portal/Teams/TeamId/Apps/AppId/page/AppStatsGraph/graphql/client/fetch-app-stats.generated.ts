/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
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
  app_stats_aggregate: {
    __typename?: "app_stats_returning_aggregate";
    aggregate?: {
      __typename?: "app_stats_returning_aggregate_fields";
      sum?: {
        __typename?: "app_stats_returning_sum_fields";
        verifications?: number | null;
        unique_users?: number | null;
      } | null;
    } | null;
  };
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
    app_stats_aggregate(
      args: { appId: $appId, startsAt: $startsAt, timespan: $timeSpan }
    ) {
      aggregate {
        sum {
          verifications
          unique_users
        }
      }
    }
    app(where: { id: { _eq: $appId } }) {
      id
      engine
    }
  }
`;

/**
 * __useFetchAppStatsQuery__
 *
 * To run a query within a React component, call `useFetchAppStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchAppStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchAppStatsQuery({
 *   variables: {
 *      appId: // value for 'appId'
 *      startsAt: // value for 'startsAt'
 *      timeSpan: // value for 'timeSpan'
 *   },
 * });
 */
export function useFetchAppStatsQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchAppStatsQuery,
    FetchAppStatsQueryVariables
  > &
    (
      | { variables: FetchAppStatsQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchAppStatsQuery, FetchAppStatsQueryVariables>(
    FetchAppStatsDocument,
    options,
  );
}
export function useFetchAppStatsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchAppStatsQuery,
    FetchAppStatsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchAppStatsQuery, FetchAppStatsQueryVariables>(
    FetchAppStatsDocument,
    options,
  );
}
export function useFetchAppStatsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        FetchAppStatsQuery,
        FetchAppStatsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    FetchAppStatsQuery,
    FetchAppStatsQueryVariables
  >(FetchAppStatsDocument, options);
}
export type FetchAppStatsQueryHookResult = ReturnType<
  typeof useFetchAppStatsQuery
>;
export type FetchAppStatsLazyQueryHookResult = ReturnType<
  typeof useFetchAppStatsLazyQuery
>;
export type FetchAppStatsSuspenseQueryHookResult = ReturnType<
  typeof useFetchAppStatsSuspenseQuery
>;
export type FetchAppStatsQueryResult = Apollo.QueryResult<
  FetchAppStatsQuery,
  FetchAppStatsQueryVariables
>;
