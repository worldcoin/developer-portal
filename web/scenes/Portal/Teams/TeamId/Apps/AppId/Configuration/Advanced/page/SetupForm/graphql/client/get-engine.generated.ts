/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetEngineQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetEngineQuery = {
  __typename?: "query_root";
  app_by_pk?: { __typename?: "app"; engine: string } | null;
};

export const GetEngineDocument = gql`
  query getEngine($app_id: String!) {
    app_by_pk(id: $app_id) {
      engine
    }
  }
`;

/**
 * __useGetEngineQuery__
 *
 * To run a query within a React component, call `useGetEngineQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetEngineQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetEngineQuery({
 *   variables: {
 *      app_id: // value for 'app_id'
 *   },
 * });
 */
export function useGetEngineQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetEngineQuery,
    GetEngineQueryVariables
  > &
    (
      | { variables: GetEngineQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetEngineQuery, GetEngineQueryVariables>(
    GetEngineDocument,
    options,
  );
}
export function useGetEngineLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetEngineQuery,
    GetEngineQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetEngineQuery, GetEngineQueryVariables>(
    GetEngineDocument,
    options,
  );
}
export function useGetEngineSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<GetEngineQuery, GetEngineQueryVariables>,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetEngineQuery, GetEngineQueryVariables>(
    GetEngineDocument,
    options,
  );
}
export type GetEngineQueryHookResult = ReturnType<typeof useGetEngineQuery>;
export type GetEngineLazyQueryHookResult = ReturnType<
  typeof useGetEngineLazyQuery
>;
export type GetEngineSuspenseQueryHookResult = ReturnType<
  typeof useGetEngineSuspenseQuery
>;
export type GetEngineQueryResult = Apollo.QueryResult<
  GetEngineQuery,
  GetEngineQueryVariables
>;
