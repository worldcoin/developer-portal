/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchTeamQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"]["input"];
}>;

export type FetchTeamQuery = {
  __typename?: "query_root";
  team_by_pk?: {
    __typename?: "team";
    id: string;
    name?: string | null;
    memberships: Array<{ __typename?: "membership"; user_id: string }>;
  } | null;
};

export const FetchTeamDocument = gql`
  query FetchTeam($teamId: String!) {
    team_by_pk(id: $teamId) {
      id
      name
      memberships {
        user_id
      }
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
 *      teamId: // value for 'teamId'
 *   },
 * });
 */
export function useFetchTeamQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchTeamQuery,
    FetchTeamQueryVariables
  > &
    (
      | { variables: FetchTeamQueryVariables; skip?: boolean }
      | { skip: boolean }
    ),
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
export function useFetchTeamSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<FetchTeamQuery, FetchTeamQueryVariables>,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<FetchTeamQuery, FetchTeamQueryVariables>(
    FetchTeamDocument,
    options,
  );
}
export type FetchTeamQueryHookResult = ReturnType<typeof useFetchTeamQuery>;
export type FetchTeamLazyQueryHookResult = ReturnType<
  typeof useFetchTeamLazyQuery
>;
export type FetchTeamSuspenseQueryHookResult = ReturnType<
  typeof useFetchTeamSuspenseQuery
>;
export type FetchTeamQueryResult = Apollo.QueryResult<
  FetchTeamQuery,
  FetchTeamQueryVariables
>;
