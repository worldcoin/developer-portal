/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetSingleActionQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
}>;

export type GetSingleActionQuery = {
  __typename?: "query_root";
  action_by_pk?: {
    __typename?: "action";
    id: string;
    name: string;
    app_id: string;
    app: {
      __typename?: "app";
      id: string;
      rp_registration: Array<{ __typename?: "rp_registration"; rp_id: string }>;
    };
  } | null;
};

export const GetSingleActionDocument = gql`
  query GetSingleAction($action_id: String!) {
    action_by_pk(id: $action_id) {
      id
      name
      app_id
      app {
        id
        rp_registration {
          rp_id
        }
      }
    }
  }
`;

/**
 * __useGetSingleActionQuery__
 *
 * To run a query within a React component, call `useGetSingleActionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSingleActionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSingleActionQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *   },
 * });
 */
export function useGetSingleActionQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetSingleActionQuery,
    GetSingleActionQueryVariables
  > &
    (
      | { variables: GetSingleActionQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetSingleActionQuery, GetSingleActionQueryVariables>(
    GetSingleActionDocument,
    options,
  );
}
export function useGetSingleActionLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetSingleActionQuery,
    GetSingleActionQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetSingleActionQuery,
    GetSingleActionQueryVariables
  >(GetSingleActionDocument, options);
}
export function useGetSingleActionSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetSingleActionQuery,
        GetSingleActionQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetSingleActionQuery,
    GetSingleActionQueryVariables
  >(GetSingleActionDocument, options);
}
export type GetSingleActionQueryHookResult = ReturnType<
  typeof useGetSingleActionQuery
>;
export type GetSingleActionLazyQueryHookResult = ReturnType<
  typeof useGetSingleActionLazyQuery
>;
export type GetSingleActionSuspenseQueryHookResult = ReturnType<
  typeof useGetSingleActionSuspenseQuery
>;
export type GetSingleActionQueryResult = Apollo.QueryResult<
  GetSingleActionQuery,
  GetSingleActionQueryVariables
>;
