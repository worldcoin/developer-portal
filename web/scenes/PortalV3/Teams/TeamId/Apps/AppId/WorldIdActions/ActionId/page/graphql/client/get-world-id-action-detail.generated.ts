/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetWorldIdActionDetailQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetWorldIdActionDetailQuery = {
  __typename?: "query_root";
  action_v4: Array<{
    __typename?: "action_v4";
    id: string;
    action: string;
    description: string;
    rp_id: string;
    created_at: string;
    rp_registration: { __typename?: "rp_registration"; app_id: string };
    nullifiers_aggregate: {
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
      action_v4_id: string;
    }>;
  }>;
};

export const GetWorldIdActionDetailDocument = gql`
  query GetWorldIdActionDetail($action_id: String!, $app_id: String!) {
    action_v4(
      limit: 1
      where: {
        id: { _eq: $action_id }
        rp_registration: { app_id: { _eq: $app_id } }
      }
    ) {
      id
      action
      description
      rp_id
      created_at
      rp_registration {
        app_id
      }
      nullifiers_aggregate {
        aggregate {
          count
        }
      }
      nullifiers(limit: 100, order_by: { created_at: desc }) {
        id
        created_at
        nullifier
        action_v4_id
      }
    }
  }
`;

/**
 * __useGetWorldIdActionDetailQuery__
 *
 * To run a query within a React component, call `useGetWorldIdActionDetailQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWorldIdActionDetailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWorldIdActionDetailQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *      app_id: // value for 'app_id'
 *   },
 * });
 */
export function useGetWorldIdActionDetailQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetWorldIdActionDetailQuery,
    GetWorldIdActionDetailQueryVariables
  > &
    (
      | { variables: GetWorldIdActionDetailQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetWorldIdActionDetailQuery,
    GetWorldIdActionDetailQueryVariables
  >(GetWorldIdActionDetailDocument, options);
}
export function useGetWorldIdActionDetailLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetWorldIdActionDetailQuery,
    GetWorldIdActionDetailQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetWorldIdActionDetailQuery,
    GetWorldIdActionDetailQueryVariables
  >(GetWorldIdActionDetailDocument, options);
}
export function useGetWorldIdActionDetailSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetWorldIdActionDetailQuery,
        GetWorldIdActionDetailQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetWorldIdActionDetailQuery,
    GetWorldIdActionDetailQueryVariables
  >(GetWorldIdActionDetailDocument, options);
}
export type GetWorldIdActionDetailQueryHookResult = ReturnType<
  typeof useGetWorldIdActionDetailQuery
>;
export type GetWorldIdActionDetailLazyQueryHookResult = ReturnType<
  typeof useGetWorldIdActionDetailLazyQuery
>;
export type GetWorldIdActionDetailSuspenseQueryHookResult = ReturnType<
  typeof useGetWorldIdActionDetailSuspenseQuery
>;
export type GetWorldIdActionDetailQueryResult = Apollo.QueryResult<
  GetWorldIdActionDetailQuery,
  GetWorldIdActionDetailQueryVariables
>;
