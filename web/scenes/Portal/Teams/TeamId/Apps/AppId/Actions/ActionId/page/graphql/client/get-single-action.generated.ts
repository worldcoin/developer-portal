/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetSingleActionAndNullifiersQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
}>;

export type GetSingleActionAndNullifiersQuery = {
  __typename?: "query_root";
  action: Array<{
    __typename?: "action";
    id: string;
    name: string;
    nullifiers: Array<{
      __typename?: "nullifier";
      id: string;
      updated_at: string;
      nullifier_hash: string;
      uses: number;
    }>;
    app: {
      __typename?: "app";
      id: string;
      engine: string;
      rp_registration: Array<{ __typename?: "rp_registration"; rp_id: string }>;
    };
  }>;
};

export const GetSingleActionAndNullifiersDocument = gql`
  query GetSingleActionAndNullifiers($action_id: String!) {
    action(order_by: { created_at: asc }, where: { id: { _eq: $action_id } }) {
      id
      name
      nullifiers(limit: 100) {
        id
        updated_at
        nullifier_hash
        uses
      }
      app {
        id
        engine
        rp_registration {
          rp_id
        }
      }
    }
  }
`;

/**
 * __useGetSingleActionAndNullifiersQuery__
 *
 * To run a query within a React component, call `useGetSingleActionAndNullifiersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSingleActionAndNullifiersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSingleActionAndNullifiersQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *   },
 * });
 */
export function useGetSingleActionAndNullifiersQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetSingleActionAndNullifiersQuery,
    GetSingleActionAndNullifiersQueryVariables
  > &
    (
      | {
          variables: GetSingleActionAndNullifiersQueryVariables;
          skip?: boolean;
        }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetSingleActionAndNullifiersQuery,
    GetSingleActionAndNullifiersQueryVariables
  >(GetSingleActionAndNullifiersDocument, options);
}
export function useGetSingleActionAndNullifiersLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetSingleActionAndNullifiersQuery,
    GetSingleActionAndNullifiersQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetSingleActionAndNullifiersQuery,
    GetSingleActionAndNullifiersQueryVariables
  >(GetSingleActionAndNullifiersDocument, options);
}
export function useGetSingleActionAndNullifiersSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetSingleActionAndNullifiersQuery,
        GetSingleActionAndNullifiersQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetSingleActionAndNullifiersQuery,
    GetSingleActionAndNullifiersQueryVariables
  >(GetSingleActionAndNullifiersDocument, options);
}
export type GetSingleActionAndNullifiersQueryHookResult = ReturnType<
  typeof useGetSingleActionAndNullifiersQuery
>;
export type GetSingleActionAndNullifiersLazyQueryHookResult = ReturnType<
  typeof useGetSingleActionAndNullifiersLazyQuery
>;
export type GetSingleActionAndNullifiersSuspenseQueryHookResult = ReturnType<
  typeof useGetSingleActionAndNullifiersSuspenseQuery
>;
export type GetSingleActionAndNullifiersQueryResult = Apollo.QueryResult<
  GetSingleActionAndNullifiersQuery,
  GetSingleActionAndNullifiersQueryVariables
>;
