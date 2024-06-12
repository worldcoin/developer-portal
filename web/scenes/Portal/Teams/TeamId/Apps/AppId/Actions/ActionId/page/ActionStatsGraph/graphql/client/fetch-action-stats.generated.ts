/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchActionStatsQueryVariables = Types.Exact<{
  actionId: Types.Scalars["String"];
  startsAt: Types.Scalars["timestamptz"];
  timeSpan: Types.Scalars["String"];
}>;

export type FetchActionStatsQuery = {
  __typename?: "query_root";
  action_stats: Array<{
    __typename?: "action_stats_returning";
    action_id: string;
    date: string;
    verifications: number;
    unique_users: number;
  }>;
};

export const FetchActionStatsDocument = gql`
  query FetchActionStats(
    $actionId: String!
    $startsAt: timestamptz!
    $timeSpan: String!
  ) {
    action_stats(
      args: { actionId: $actionId, startsAt: $startsAt, timespan: $timeSpan }
    ) {
      action_id
      date
      verifications
      unique_users
    }
  }
`;

/**
 * __useFetchActionStatsQuery__
 *
 * To run a query within a React component, call `useFetchActionStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchActionStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchActionStatsQuery({
 *   variables: {
 *      actionId: // value for 'actionId'
 *      startsAt: // value for 'startsAt'
 *      timeSpan: // value for 'timeSpan'
 *   },
 * });
 */
export function useFetchActionStatsQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchActionStatsQuery,
    FetchActionStatsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchActionStatsQuery, FetchActionStatsQueryVariables>(
    FetchActionStatsDocument,
    options,
  );
}
export function useFetchActionStatsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchActionStatsQuery,
    FetchActionStatsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    FetchActionStatsQuery,
    FetchActionStatsQueryVariables
  >(FetchActionStatsDocument, options);
}
export type FetchActionStatsQueryHookResult = ReturnType<
  typeof useFetchActionStatsQuery
>;
export type FetchActionStatsLazyQueryHookResult = ReturnType<
  typeof useFetchActionStatsLazyQuery
>;
export type FetchActionStatsQueryResult = Apollo.QueryResult<
  FetchActionStatsQuery,
  FetchActionStatsQueryVariables
>;
