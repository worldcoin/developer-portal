/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchTeamsQueryVariables = Types.Exact<{ [key: string]: never }>;

export type FetchTeamsQuery = {
  __typename?: "query_root";
  teams: Array<{ __typename?: "team"; id: string; name?: string | null }>;
};

export const FetchTeamsDocument = gql`
  query FetchTeams {
    teams: team {
      id
      name
    }
  }
`;

/**
 * __useFetchTeamsQuery__
 *
 * To run a query within a React component, call `useFetchTeamsQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchTeamsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchTeamsQuery({
 *   variables: {
 *   },
 * });
 */
export function useFetchTeamsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    FetchTeamsQuery,
    FetchTeamsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchTeamsQuery, FetchTeamsQueryVariables>(
    FetchTeamsDocument,
    options,
  );
}
export function useFetchTeamsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchTeamsQuery,
    FetchTeamsQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchTeamsQuery, FetchTeamsQueryVariables>(
    FetchTeamsDocument,
    options,
  );
}
export type FetchTeamsQueryHookResult = ReturnType<typeof useFetchTeamsQuery>;
export type FetchTeamsLazyQueryHookResult = ReturnType<
  typeof useFetchTeamsLazyQuery
>;
export type FetchTeamsQueryResult = Apollo.QueryResult<
  FetchTeamsQuery,
  FetchTeamsQueryVariables
>;
