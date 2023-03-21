/* eslint-disable */
import * as Types from "../../graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type TeamsQueryVariables = Types.Exact<{ [key: string]: never }>;

export type TeamsQuery = {
  __typename?: "query_root";
  teams: Array<{
    __typename?: "team";
    id: string;
    name?: string | null;
    members: Array<{
      __typename?: "user";
      id: string;
      name: string;
      email: string;
    }>;
  }>;
};

export const TeamsDocument = gql`
  query Teams {
    teams: team(limit: 1) {
      id
      name
      members: users {
        id
        name
        email
      }
    }
  }
`;

/**
 * __useTeamsQuery__
 *
 * To run a query within a React component, call `useTeamsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTeamsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTeamsQuery({
 *   variables: {
 *   },
 * });
 */
export function useTeamsQuery(
  baseOptions?: Apollo.QueryHookOptions<TeamsQuery, TeamsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<TeamsQuery, TeamsQueryVariables>(
    TeamsDocument,
    options
  );
}
export function useTeamsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<TeamsQuery, TeamsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<TeamsQuery, TeamsQueryVariables>(
    TeamsDocument,
    options
  );
}
export type TeamsQueryHookResult = ReturnType<typeof useTeamsQuery>;
export type TeamsLazyQueryHookResult = ReturnType<typeof useTeamsLazyQuery>;
export type TeamsQueryResult = Apollo.QueryResult<
  TeamsQuery,
  TeamsQueryVariables
>;
