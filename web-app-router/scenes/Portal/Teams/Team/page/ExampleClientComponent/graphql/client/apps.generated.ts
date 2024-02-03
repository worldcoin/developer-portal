/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type AppsQueryVariables = Types.Exact<{ [key: string]: never }>;

export type AppsQuery = {
  __typename?: "query_root";
  app: Array<{ __typename?: "app"; id: string }>;
};

export const AppsDocument = gql`
  query Apps {
    app {
      id
    }
  }
`;

/**
 * __useAppsQuery__
 *
 * To run a query within a React component, call `useAppsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAppsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAppsQuery({
 *   variables: {
 *   },
 * });
 */
export function useAppsQuery(
  baseOptions?: Apollo.QueryHookOptions<AppsQuery, AppsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<AppsQuery, AppsQueryVariables>(AppsDocument, options);
}
export function useAppsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<AppsQuery, AppsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<AppsQuery, AppsQueryVariables>(
    AppsDocument,
    options,
  );
}
export type AppsQueryHookResult = ReturnType<typeof useAppsQuery>;
export type AppsLazyQueryHookResult = ReturnType<typeof useAppsLazyQuery>;
export type AppsQueryResult = Apollo.QueryResult<AppsQuery, AppsQueryVariables>;
