/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetWorldIdOverviewQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetWorldIdOverviewQuery = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    id: string;
    is_banned: boolean;
    is_staging: boolean;
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
  }>;
  action: Array<{ __typename?: "action"; id: string }>;
};

export const GetWorldIdOverviewDocument = gql`
  query GetWorldIdOverview($app_id: String!) {
    app(where: { id: { _eq: $app_id } }) {
      id
      is_banned
      is_staging
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
    }
    action(
      where: { app_id: { _eq: $app_id }, action: { _neq: "" } }
      limit: 1
    ) {
      id
    }
  }
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
