/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetWorldIdAppTrendQueryVariables = Types.Exact<{
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

export type GetWorldIdAppTrendQuery = {
  __typename?: "query_root";
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
};

export type GetWorldIdActionTrendQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
  action_id: Types.Scalars["String"]["input"];
  d0: Types.Scalars["timestamptz"]["input"];
  d1: Types.Scalars["timestamptz"]["input"];
  d2: Types.Scalars["timestamptz"]["input"];
  d3: Types.Scalars["timestamptz"]["input"];
  d4: Types.Scalars["timestamptz"]["input"];
  d5: Types.Scalars["timestamptz"]["input"];
  d6: Types.Scalars["timestamptz"]["input"];
  d7: Types.Scalars["timestamptz"]["input"];
}>;

export type GetWorldIdActionTrendQuery = {
  __typename?: "query_root";
  action_v4: Array<{
    __typename?: "action_v4";
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

export type WorldIdActionTrendBucketsFragment = {
  __typename?: "action_v4";
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
};

export type WorldIdTrendCountFragment = {
  __typename?: "nullifier_v4_aggregate";
  aggregate?: {
    __typename?: "nullifier_v4_aggregate_fields";
    count: number;
  } | null;
};

export const WorldIdTrendCountFragmentDoc = gql`
  fragment WorldIdTrendCount on nullifier_v4_aggregate {
    aggregate {
      count
    }
  }
`;
export const WorldIdActionTrendBucketsFragmentDoc = gql`
  fragment WorldIdActionTrendBuckets on action_v4 {
    b0: nullifiers_aggregate(where: { created_at: { _gte: $d0, _lt: $d1 } }) {
      ...WorldIdTrendCount
    }
    b1: nullifiers_aggregate(where: { created_at: { _gte: $d1, _lt: $d2 } }) {
      ...WorldIdTrendCount
    }
    b2: nullifiers_aggregate(where: { created_at: { _gte: $d2, _lt: $d3 } }) {
      ...WorldIdTrendCount
    }
    b3: nullifiers_aggregate(where: { created_at: { _gte: $d3, _lt: $d4 } }) {
      ...WorldIdTrendCount
    }
    b4: nullifiers_aggregate(where: { created_at: { _gte: $d4, _lt: $d5 } }) {
      ...WorldIdTrendCount
    }
    b5: nullifiers_aggregate(where: { created_at: { _gte: $d5, _lt: $d6 } }) {
      ...WorldIdTrendCount
    }
    b6: nullifiers_aggregate(where: { created_at: { _gte: $d6, _lt: $d7 } }) {
      ...WorldIdTrendCount
    }
  }
  ${WorldIdTrendCountFragmentDoc}
`;
export const GetWorldIdAppTrendDocument = gql`
  query GetWorldIdAppTrend(
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
    b0: nullifier_v4_aggregate(
      where: {
        created_at: { _gte: $d0, _lt: $d1 }
        action_v4: {
          environment: { _eq: "production" }
          rp_registration: { app_id: { _eq: $app_id } }
        }
      }
    ) {
      ...WorldIdTrendCount
    }
    b1: nullifier_v4_aggregate(
      where: {
        created_at: { _gte: $d1, _lt: $d2 }
        action_v4: {
          environment: { _eq: "production" }
          rp_registration: { app_id: { _eq: $app_id } }
        }
      }
    ) {
      ...WorldIdTrendCount
    }
    b2: nullifier_v4_aggregate(
      where: {
        created_at: { _gte: $d2, _lt: $d3 }
        action_v4: {
          environment: { _eq: "production" }
          rp_registration: { app_id: { _eq: $app_id } }
        }
      }
    ) {
      ...WorldIdTrendCount
    }
    b3: nullifier_v4_aggregate(
      where: {
        created_at: { _gte: $d3, _lt: $d4 }
        action_v4: {
          environment: { _eq: "production" }
          rp_registration: { app_id: { _eq: $app_id } }
        }
      }
    ) {
      ...WorldIdTrendCount
    }
    b4: nullifier_v4_aggregate(
      where: {
        created_at: { _gte: $d4, _lt: $d5 }
        action_v4: {
          environment: { _eq: "production" }
          rp_registration: { app_id: { _eq: $app_id } }
        }
      }
    ) {
      ...WorldIdTrendCount
    }
    b5: nullifier_v4_aggregate(
      where: {
        created_at: { _gte: $d5, _lt: $d6 }
        action_v4: {
          environment: { _eq: "production" }
          rp_registration: { app_id: { _eq: $app_id } }
        }
      }
    ) {
      ...WorldIdTrendCount
    }
    b6: nullifier_v4_aggregate(
      where: {
        created_at: { _gte: $d6, _lt: $d7 }
        action_v4: {
          environment: { _eq: "production" }
          rp_registration: { app_id: { _eq: $app_id } }
        }
      }
    ) {
      ...WorldIdTrendCount
    }
  }
  ${WorldIdTrendCountFragmentDoc}
`;

/**
 * __useGetWorldIdAppTrendQuery__
 *
 * To run a query within a React component, call `useGetWorldIdAppTrendQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWorldIdAppTrendQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWorldIdAppTrendQuery({
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
export function useGetWorldIdAppTrendQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetWorldIdAppTrendQuery,
    GetWorldIdAppTrendQueryVariables
  > &
    (
      | { variables: GetWorldIdAppTrendQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetWorldIdAppTrendQuery,
    GetWorldIdAppTrendQueryVariables
  >(GetWorldIdAppTrendDocument, options);
}
export function useGetWorldIdAppTrendLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetWorldIdAppTrendQuery,
    GetWorldIdAppTrendQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetWorldIdAppTrendQuery,
    GetWorldIdAppTrendQueryVariables
  >(GetWorldIdAppTrendDocument, options);
}
export function useGetWorldIdAppTrendSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetWorldIdAppTrendQuery,
        GetWorldIdAppTrendQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetWorldIdAppTrendQuery,
    GetWorldIdAppTrendQueryVariables
  >(GetWorldIdAppTrendDocument, options);
}
export type GetWorldIdAppTrendQueryHookResult = ReturnType<
  typeof useGetWorldIdAppTrendQuery
>;
export type GetWorldIdAppTrendLazyQueryHookResult = ReturnType<
  typeof useGetWorldIdAppTrendLazyQuery
>;
export type GetWorldIdAppTrendSuspenseQueryHookResult = ReturnType<
  typeof useGetWorldIdAppTrendSuspenseQuery
>;
export type GetWorldIdAppTrendQueryResult = Apollo.QueryResult<
  GetWorldIdAppTrendQuery,
  GetWorldIdAppTrendQueryVariables
>;
export const GetWorldIdActionTrendDocument = gql`
  query GetWorldIdActionTrend(
    $app_id: String!
    $action_id: String!
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
      ...WorldIdActionTrendBuckets
    }
  }
  ${WorldIdActionTrendBucketsFragmentDoc}
`;

/**
 * __useGetWorldIdActionTrendQuery__
 *
 * To run a query within a React component, call `useGetWorldIdActionTrendQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWorldIdActionTrendQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWorldIdActionTrendQuery({
 *   variables: {
 *      app_id: // value for 'app_id'
 *      action_id: // value for 'action_id'
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
export function useGetWorldIdActionTrendQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetWorldIdActionTrendQuery,
    GetWorldIdActionTrendQueryVariables
  > &
    (
      | { variables: GetWorldIdActionTrendQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetWorldIdActionTrendQuery,
    GetWorldIdActionTrendQueryVariables
  >(GetWorldIdActionTrendDocument, options);
}
export function useGetWorldIdActionTrendLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetWorldIdActionTrendQuery,
    GetWorldIdActionTrendQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetWorldIdActionTrendQuery,
    GetWorldIdActionTrendQueryVariables
  >(GetWorldIdActionTrendDocument, options);
}
export function useGetWorldIdActionTrendSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetWorldIdActionTrendQuery,
        GetWorldIdActionTrendQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetWorldIdActionTrendQuery,
    GetWorldIdActionTrendQueryVariables
  >(GetWorldIdActionTrendDocument, options);
}
export type GetWorldIdActionTrendQueryHookResult = ReturnType<
  typeof useGetWorldIdActionTrendQuery
>;
export type GetWorldIdActionTrendLazyQueryHookResult = ReturnType<
  typeof useGetWorldIdActionTrendLazyQuery
>;
export type GetWorldIdActionTrendSuspenseQueryHookResult = ReturnType<
  typeof useGetWorldIdActionTrendSuspenseQuery
>;
export type GetWorldIdActionTrendQueryResult = Apollo.QueryResult<
  GetWorldIdActionTrendQuery,
  GetWorldIdActionTrendQueryVariables
>;
