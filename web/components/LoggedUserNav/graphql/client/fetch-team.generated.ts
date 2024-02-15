/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchTeamQueryVariables = Types.Exact<{
  id: Types.Scalars["String"];
}>;

export type FetchTeamQuery = {
  __typename?: "query_root";
  team?: { __typename?: "team"; id: string; name?: string | null } | null;
};

export const FetchTeamDocument = gql`
  query FetchTeam($id: String!) {
    team: team_by_pk(id: $id) {
      id
      name
    }
  }
`;

/**
 * __useFetchTeamQuery__
 *
 * To run a query within a React component, call `useFetchTeamQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchTeamQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchTeamQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useFetchTeamQuery(
  baseOptions: Apollo.QueryHookOptions<FetchTeamQuery, FetchTeamQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchTeamQuery, FetchTeamQueryVariables>(
    FetchTeamDocument,
    options,
  );
}
export function useFetchTeamLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchTeamQuery,
    FetchTeamQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchTeamQuery, FetchTeamQueryVariables>(
    FetchTeamDocument,
    options,
  );
}
export type FetchTeamQueryHookResult = ReturnType<typeof useFetchTeamQuery>;
export type FetchTeamLazyQueryHookResult = ReturnType<
  typeof useFetchTeamLazyQuery
>;
export type FetchTeamQueryResult = Apollo.QueryResult<
  FetchTeamQuery,
  FetchTeamQueryVariables
>;
