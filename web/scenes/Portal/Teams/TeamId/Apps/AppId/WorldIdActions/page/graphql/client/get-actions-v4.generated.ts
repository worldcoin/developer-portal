/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetActionsV4QueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetActionsV4Query = {
  __typename?: "query_root";
  app: Array<{
    __typename?: "app";
    rp_registration: Array<{ __typename?: "rp_registration"; rp_id: string }>;
  }>;
  action_v4: Array<{
    __typename?: "action_v4";
    id: string;
    action: string;
    description: string;
    environment: unknown;
    created_at: string;
  }>;
};

export const GetActionsV4Document = gql`
  query GetActionsV4($app_id: String!) {
    app(where: { id: { _eq: $app_id } }) {
      rp_registration {
        rp_id
      }
    }
    action_v4(where: { rp_registration: { app: { id: { _eq: $app_id } } } }) {
      id
      action
      description
      environment
      created_at
    }
  }
`;

/**
 * __useGetActionsV4Query__
 *
 * To run a query within a React component, call `useGetActionsV4Query` and pass it any options that fit your needs.
 * When your component renders, `useGetActionsV4Query` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetActionsV4Query({
 *   variables: {
 *      app_id: // value for 'app_id'
 *   },
 * });
 */
export function useGetActionsV4Query(
  baseOptions: Apollo.QueryHookOptions<
    GetActionsV4Query,
    GetActionsV4QueryVariables
  > &
    (
      | { variables: GetActionsV4QueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetActionsV4Query, GetActionsV4QueryVariables>(
    GetActionsV4Document,
    options,
  );
}
export function useGetActionsV4LazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetActionsV4Query,
    GetActionsV4QueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetActionsV4Query, GetActionsV4QueryVariables>(
    GetActionsV4Document,
    options,
  );
}
export function useGetActionsV4SuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetActionsV4Query,
        GetActionsV4QueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetActionsV4Query, GetActionsV4QueryVariables>(
    GetActionsV4Document,
    options,
  );
}
export type GetActionsV4QueryHookResult = ReturnType<
  typeof useGetActionsV4Query
>;
export type GetActionsV4LazyQueryHookResult = ReturnType<
  typeof useGetActionsV4LazyQuery
>;
export type GetActionsV4SuspenseQueryHookResult = ReturnType<
  typeof useGetActionsV4SuspenseQuery
>;
export type GetActionsV4QueryResult = Apollo.QueryResult<
  GetActionsV4Query,
  GetActionsV4QueryVariables
>;
