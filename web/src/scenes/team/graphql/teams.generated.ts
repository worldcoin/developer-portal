/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type TeamsQueryVariables = Types.Exact<{
  team_id?: Types.InputMaybe<Types.Scalars["String"]>;
}>;

export type TeamsQuery = {
  __typename?: "query_root";
  team: Array<{
    __typename?: "team";
    id: string;
    name?: string | null;
    memberships: Array<{
      __typename?: "membership";
      id: string;
      role: Types.Role_Enum;
      user: {
        __typename?: "user";
        id: string;
        name: string;
        email?: string | null;
      };
    }>;
  }>;
};

export const TeamsDocument = gql`
  query Teams($team_id: String) {
    team(where: { id: { _eq: $team_id } }) {
      id
      name
      memberships {
        id
        user {
          id
          name
          email
        }
        role
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
 *      team_id: // value for 'team_id'
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
