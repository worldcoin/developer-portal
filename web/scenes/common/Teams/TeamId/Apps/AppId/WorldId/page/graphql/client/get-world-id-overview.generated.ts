/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import { WorldIdActionTrendBucketsFragmentDoc } from "../../../graphql/client/get-world-id-trends.generated";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetWorldIdOverviewQueryVariables = Types.Exact<{
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

export type GetWorldIdOverviewQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    is_banned: boolean;
    is_staging: boolean;
    app_metadata: Array<{ __typename?: "app_metadata"; name: string }>;
    rp_registration: Array<{
      __typename?: "rp_registration";
      rp_id: string;
      app_id: string;
      status: unknown;
      staging_status?: unknown | null;
      mode: unknown;
      signer_address?: string | null;
      created_at: string;
    }>;
  }>;
  action_v4: Array<{
    __typename?: "action_v4";
    id: string;
    action: string;
    description: string;
    created_at: string;
    total: {
      __typename?: "nullifier_v4_aggregate";
      aggregate?: {
        __typename?: "nullifier_v4_aggregate_fields";
        count: number;
      } | null;
    };
    latest: {
      __typename?: "nullifier_v4_aggregate";
      aggregate?: {
        __typename?: "nullifier_v4_aggregate_fields";
        max?: {
          __typename?: "nullifier_v4_max_fields";
          created_at?: string | null;
        } | null;
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
  action: Array<{ __typename?: "action"; id: string }>;
};

export const GetWorldIdOverviewDocument = gql`
  query GetWorldIdOverview(
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
    app(where: { id: { _eq: $app_id } }) {
      id
      is_banned
      is_staging
      app_metadata {
        name
      }
      rp_registration {
        rp_id
        app_id
        status
        staging_status
        mode
        signer_address
        created_at
      }
    }
    action_v4(
      where: {
        environment: { _eq: "production" }
        rp_registration: { app: { id: { _eq: $app_id } } }
      }
      order_by: { created_at: desc }
    ) {
      id
      action
      description
      created_at
      total: nullifiers_aggregate {
        aggregate {
          count
        }
      }
      latest: nullifiers_aggregate {
        aggregate {
          max {
            created_at
          }
        }
      }
      ...WorldIdActionTrendBuckets
    }
    action(
      where: { app_id: { _eq: $app_id }, action: { _neq: "" } }
      limit: 1
    ) {
      id
    }
  }
  ${WorldIdActionTrendBucketsFragmentDoc}
`;

/**
 * __useGetWorldIdOverviewQuery__
 *
 * To run a query within a React component, call `useGetWorldIdOverviewQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWorldIdOverviewQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWorldIdOverviewQuery({
 *   variables: {
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
export function useGetWorldIdOverviewQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetWorldIdOverviewQuery,
    GetWorldIdOverviewQueryVariables
  > &
    (
      | { variables: GetWorldIdOverviewQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetWorldIdOverviewQuery,
    GetWorldIdOverviewQueryVariables
  >(GetWorldIdOverviewDocument, options);
}
export function useGetWorldIdOverviewLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetWorldIdOverviewQuery,
    GetWorldIdOverviewQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetWorldIdOverviewQuery,
    GetWorldIdOverviewQueryVariables
  >(GetWorldIdOverviewDocument, options);
}
export function useGetWorldIdOverviewSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetWorldIdOverviewQuery,
        GetWorldIdOverviewQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetWorldIdOverviewQuery,
    GetWorldIdOverviewQueryVariables
  >(GetWorldIdOverviewDocument, options);
}
export type GetWorldIdOverviewQueryHookResult = ReturnType<
  typeof useGetWorldIdOverviewQuery
>;
export type GetWorldIdOverviewLazyQueryHookResult = ReturnType<
  typeof useGetWorldIdOverviewLazyQuery
>;
export type GetWorldIdOverviewSuspenseQueryHookResult = ReturnType<
  typeof useGetWorldIdOverviewSuspenseQuery
>;
export type GetWorldIdOverviewQueryResult = Apollo.QueryResult<
  GetWorldIdOverviewQuery,
  GetWorldIdOverviewQueryVariables
>;
