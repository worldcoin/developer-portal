/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type GetIsAppBannedQueryVariables = Types.Exact<{
  app_id: Types.Scalars["String"]["input"];
}>;

export type GetIsAppBannedQuery = {
  __typename?: "query_root";
  app: Array<{ __typename?: "app"; id: string }>;
};

export const GetIsAppBannedDocument = gql`
  query GetIsAppBanned($app_id: String!) {
    app: app(where: { id: { _eq: $app_id }, is_banned: { _eq: true } }) {
      id
    }
  }
`;

/**
 * __useGetIsAppBannedQuery__
 *
 * To run a query within a React component, call `useGetIsAppBannedQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetIsAppBannedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetIsAppBannedQuery({
 *   variables: {
 *      app_id: // value for 'app_id'
 *   },
 * });
 */
export function useGetIsAppBannedQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetIsAppBannedQuery,
    GetIsAppBannedQueryVariables
  > &
    (
      | { variables: GetIsAppBannedQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetIsAppBannedQuery, GetIsAppBannedQueryVariables>(
    GetIsAppBannedDocument,
    options,
  );
}
export function useGetIsAppBannedLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetIsAppBannedQuery,
    GetIsAppBannedQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetIsAppBannedQuery, GetIsAppBannedQueryVariables>(
    GetIsAppBannedDocument,
    options,
  );
}
export function useGetIsAppBannedSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetIsAppBannedQuery,
        GetIsAppBannedQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetIsAppBannedQuery,
    GetIsAppBannedQueryVariables
  >(GetIsAppBannedDocument, options);
}
export type GetIsAppBannedQueryHookResult = ReturnType<
  typeof useGetIsAppBannedQuery
>;
export type GetIsAppBannedLazyQueryHookResult = ReturnType<
  typeof useGetIsAppBannedLazyQuery
>;
export type GetIsAppBannedSuspenseQueryHookResult = ReturnType<
  typeof useGetIsAppBannedSuspenseQuery
>;
export type GetIsAppBannedQueryResult = Apollo.QueryResult<
  GetIsAppBannedQuery,
  GetIsAppBannedQueryVariables
>;
