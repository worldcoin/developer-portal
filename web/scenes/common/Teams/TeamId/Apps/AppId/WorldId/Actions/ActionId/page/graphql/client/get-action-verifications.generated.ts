/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import { WorldIdActionTrendBucketsFragmentDoc } from "../../../../../graphql/client/get-world-id-trends.generated";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetActionVerificationsFeedQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  limit: Types.Scalars["Int"]["input"];
  offset: Types.Scalars["Int"]["input"];
}>;

export type GetActionVerificationsFeedQuery = {
  __typename?: "query_root";
  action_v4: Array<{
    __typename?: "action_v4";
    id: string;
    action: string;
    description: string;
    rp_id: string;
    created_at: string;
    rp_registration: { __typename?: "rp_registration"; app_id: string };
    total: {
      __typename?: "nullifier_v4_aggregate";
      aggregate?: {
        __typename?: "nullifier_v4_aggregate_fields";
        count: number;
      } | null;
    };
    nullifiers: Array<{
      __typename?: "nullifier_v4";
      id: string;
      created_at: string;
      nullifier: string;
    }>;
  }>;
};

export type GetActionStatsQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
  d0: Types.Scalars["timestamptz"]["input"];
  d1: Types.Scalars["timestamptz"]["input"];
  d2: Types.Scalars["timestamptz"]["input"];
  d3: Types.Scalars["timestamptz"]["input"];
  d4: Types.Scalars["timestamptz"]["input"];
  d5: Types.Scalars["timestamptz"]["input"];
  d6: Types.Scalars["timestamptz"]["input"];
  d7: Types.Scalars["timestamptz"]["input"];
}>;

export type GetActionStatsQuery = {
  __typename?: "query_root";
  action_v4: Array<{
    __typename?: "action_v4";
    id: string;
    week: {
      __typename?: "nullifier_v4_aggregate";
      aggregate?: {
        __typename?: "nullifier_v4_aggregate_fields";
        count: number;
      } | null;
    };
    b0: {
      __typename?: "nullifier_v4_aggregate";
      aggregate?: {
        __typename?: "nullifier_v4_aggregate_fields";
        count: number;
      } | null;
    };
    b1: {
      __typename?: "nullifier_v4_aggregate";
      aggregate?: {
        __typename?: "nullifier_v4_aggregate_fields";
        count: number;
      } | null;
    };
    b2: {
      __typename?: "nullifier_v4_aggregate";
      aggregate?: {
        __typename?: "nullifier_v4_aggregate_fields";
        count: number;
      } | null;
    };
    b3: {
      __typename?: "nullifier_v4_aggregate";
      aggregate?: {
        __typename?: "nullifier_v4_aggregate_fields";
        count: number;
      } | null;
    };
    b4: {
      __typename?: "nullifier_v4_aggregate";
      aggregate?: {
        __typename?: "nullifier_v4_aggregate_fields";
        count: number;
      } | null;
    };
    b5: {
      __typename?: "nullifier_v4_aggregate";
      aggregate?: {
        __typename?: "nullifier_v4_aggregate_fields";
        count: number;
      } | null;
    };
    b6: {
      __typename?: "nullifier_v4_aggregate";
      aggregate?: {
        __typename?: "nullifier_v4_aggregate_fields";
        count: number;
      } | null;
    };
  }>;
};

export const GetActionVerificationsFeedDocument = gql`
  query GetActionVerificationsFeed(
    $action_id: String!
    $app_id: String!
    $limit: Int!
    $offset: Int!
  ) {
    action_v4(
      where: {
        id: { _eq: $action_id }
        environment: { _eq: "production" }
        rp_registration: { app_id: { _eq: $app_id } }
      }
      limit: 1
    ) {
      id
      action
      description
      rp_id
      created_at
      rp_registration {
        app_id
      }
      total: nullifiers_aggregate {
        aggregate {
          count
        }
      }
      nullifiers(
        limit: $limit
        offset: $offset
        order_by: [{ created_at: desc }, { id: desc }]
      ) {
        id
        created_at
        nullifier
      }
    }
  }
`;

/**
 * __useGetActionVerificationsFeedQuery__
 *
 * To run a query within a React component, call `useGetActionVerificationsFeedQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetActionVerificationsFeedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetActionVerificationsFeedQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *      app_id: // value for 'app_id'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetActionVerificationsFeedQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetActionVerificationsFeedQuery,
    GetActionVerificationsFeedQueryVariables
  > &
    (
      | { variables: GetActionVerificationsFeedQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetActionVerificationsFeedQuery,
    GetActionVerificationsFeedQueryVariables
  >(GetActionVerificationsFeedDocument, options);
}
export function useGetActionVerificationsFeedLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetActionVerificationsFeedQuery,
    GetActionVerificationsFeedQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetActionVerificationsFeedQuery,
    GetActionVerificationsFeedQueryVariables
  >(GetActionVerificationsFeedDocument, options);
}
export function useGetActionVerificationsFeedSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetActionVerificationsFeedQuery,
        GetActionVerificationsFeedQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetActionVerificationsFeedQuery,
    GetActionVerificationsFeedQueryVariables
  >(GetActionVerificationsFeedDocument, options);
}
export type GetActionVerificationsFeedQueryHookResult = ReturnType<
  typeof useGetActionVerificationsFeedQuery
>;
export type GetActionVerificationsFeedLazyQueryHookResult = ReturnType<
  typeof useGetActionVerificationsFeedLazyQuery
>;
export type GetActionVerificationsFeedSuspenseQueryHookResult = ReturnType<
  typeof useGetActionVerificationsFeedSuspenseQuery
>;
export type GetActionVerificationsFeedQueryResult = Apollo.QueryResult<
  GetActionVerificationsFeedQuery,
  GetActionVerificationsFeedQueryVariables
>;
export const GetActionStatsDocument = gql`
  query GetActionStats(
    $action_id: String!
    $app_id: String!
    $d0: timestamptz!
    $d1: timestamptz!
    $d2: timestamptz!
    $d3: timestamptz!
    $d4: timestamptz!
    $d5: timestamptz!
    $d6: timestamptz!
    $d7: timestamptz!
  ) {
    action_v4(
      where: {
        id: { _eq: $action_id }
        environment: { _eq: "production" }
        rp_registration: { app_id: { _eq: $app_id } }
      }
      limit: 1
    ) {
      id
      week: nullifiers_aggregate(
        where: { created_at: { _gte: $d0, _lt: $d7 } }
      ) {
        aggregate {
          count
        }
      }
      ...WorldIdActionTrendBuckets
    }
  }
  ${WorldIdActionTrendBucketsFragmentDoc}
`;

/**
 * __useGetActionStatsQuery__
 *
 * To run a query within a React component, call `useGetActionStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetActionStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetActionStatsQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *      app_id: // value for 'app_id'
 *      d0: // value for 'd0'
 *      d1: // value for 'd1'
 *      d2: // value for 'd2'
 *      d3: // value for 'd3'
 *      d4: // value for 'd4'
 *      d5: // value for 'd5'
 *      d6: // value for 'd6'
 *      d7: // value for 'd7'
 *   },
 * });
 */
export function useGetActionStatsQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetActionStatsQuery,
    GetActionStatsQueryVariables
  > &
    (
      | { variables: GetActionStatsQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetActionStatsQuery, GetActionStatsQueryVariables>(
    GetActionStatsDocument,
    options,
  );
}
export function useGetActionStatsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetActionStatsQuery,
    GetActionStatsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetActionStatsQuery, GetActionStatsQueryVariables>(
    GetActionStatsDocument,
    options,
  );
}
export function useGetActionStatsSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetActionStatsQuery,
        GetActionStatsQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetActionStatsQuery,
    GetActionStatsQueryVariables
  >(GetActionStatsDocument, options);
}
export type GetActionStatsQueryHookResult = ReturnType<
  typeof useGetActionStatsQuery
>;
export type GetActionStatsLazyQueryHookResult = ReturnType<
  typeof useGetActionStatsLazyQuery
>;
export type GetActionStatsSuspenseQueryHookResult = ReturnType<
  typeof useGetActionStatsSuspenseQuery
>;
export type GetActionStatsQueryResult = Apollo.QueryResult<
  GetActionStatsQuery,
  GetActionStatsQueryVariables
>;
