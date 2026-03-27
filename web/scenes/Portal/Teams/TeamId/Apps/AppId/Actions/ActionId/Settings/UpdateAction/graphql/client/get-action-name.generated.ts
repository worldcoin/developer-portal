/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetActionNameQueryVariables = Types.Exact<{
  action_id: Types.Scalars["String"]["input"];
}>;

export type GetActionNameQuery = {
  __typename?: "query_root";
  action_by_pk?: { __typename?: "action"; id: string; name: string } | null;
};

export const GetActionNameDocument = gql`
  query GetActionName($action_id: String!) {
    action_by_pk(id: $action_id) {
      id
      name
    }
  }
`;

/**
 * __useGetActionNameQuery__
 *
 * To run a query within a React component, call `useGetActionNameQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetActionNameQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetActionNameQuery({
 *   variables: {
 *      action_id: // value for 'action_id'
 *   },
 * });
 */
export function useGetActionNameQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetActionNameQuery,
    GetActionNameQueryVariables
  > &
    (
      | { variables: GetActionNameQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetActionNameQuery, GetActionNameQueryVariables>(
    GetActionNameDocument,
    options,
  );
}
export function useGetActionNameLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetActionNameQuery,
    GetActionNameQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetActionNameQuery, GetActionNameQueryVariables>(
    GetActionNameDocument,
    options,
  );
}
export function useGetActionNameSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetActionNameQuery,
        GetActionNameQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetActionNameQuery,
    GetActionNameQueryVariables
  >(GetActionNameDocument, options);
}
export type GetActionNameQueryHookResult = ReturnType<
  typeof useGetActionNameQuery
>;
export type GetActionNameLazyQueryHookResult = ReturnType<
  typeof useGetActionNameLazyQuery
>;
export type GetActionNameSuspenseQueryHookResult = ReturnType<
  typeof useGetActionNameSuspenseQuery
>;
export type GetActionNameQueryResult = Apollo.QueryResult<
  GetActionNameQuery,
  GetActionNameQueryVariables
>;
