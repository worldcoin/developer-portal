/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetSingleActionV4QueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
}>;

export type GetSingleActionV4Query = {
  __typename?: "query_root";
  action_v4_by_pk?: {
    __typename?: "action_v4";
    id: string;
    action: string;
    description: string;
    environment: unknown;
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
  } | null;
};

export const GetSingleActionV4Document = gql`
  query GetSingleActionV4($action_id: String!) {
    action_v4_by_pk(id: $action_id) {
      id
      action
      description
      environment
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
 * __useGetSingleActionV4Query__
 *
 * To run a query within a React component, call `useGetSingleActionV4Query` and pass it any options that fit your needs.
 * When your component renders, `useGetSingleActionV4Query` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSingleActionV4Query({
 *   variables: {
 *      action_id: // value for 'action_id'
 *   },
 * });
 */
export function useGetSingleActionV4Query(
  baseOptions: Apollo.QueryHookOptions<
    GetSingleActionV4Query,
    GetSingleActionV4QueryVariables
  > &
    (
      | { variables: GetSingleActionV4QueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetSingleActionV4Query,
    GetSingleActionV4QueryVariables
  >(GetSingleActionV4Document, options);
}
export function useGetSingleActionV4LazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetSingleActionV4Query,
    GetSingleActionV4QueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetSingleActionV4Query,
    GetSingleActionV4QueryVariables
  >(GetSingleActionV4Document, options);
}
export function useGetSingleActionV4SuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetSingleActionV4Query,
        GetSingleActionV4QueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetSingleActionV4Query,
    GetSingleActionV4QueryVariables
  >(GetSingleActionV4Document, options);
}
export type GetSingleActionV4QueryHookResult = ReturnType<
  typeof useGetSingleActionV4Query
>;
export type GetSingleActionV4LazyQueryHookResult = ReturnType<
  typeof useGetSingleActionV4LazyQuery
>;
export type GetSingleActionV4SuspenseQueryHookResult = ReturnType<
  typeof useGetSingleActionV4SuspenseQuery
>;
export type GetSingleActionV4QueryResult = Apollo.QueryResult<
  GetSingleActionV4Query,
  GetSingleActionV4QueryVariables
>;
