/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchMembersQueryVariables = Types.Exact<{
  user_id: Types.Scalars["String"];
  team_id: Types.Scalars["String"];
}>;

export type FetchMembersQuery = {
  __typename?: "query_root";
  members: Array<{
    __typename?: "membership";
    id: string;
    user: {
      __typename?: "user";
      id: string;
      name: string;
      email?: string | null;
      world_id_nullifier?: string | null;
    };
  }>;
};

export const FetchMembersDocument = gql`
  query FetchMembers($user_id: String!, $team_id: String!) {
    members: membership(
      where: {
        _and: { user_id: { _neq: $user_id }, team_id: { _eq: $team_id } }
      }
    ) {
      id
      user {
        id
        name
        email
        world_id_nullifier
      }
    }
  }
`;

/**
 * __useFetchMembersQuery__
 *
 * To run a query within a React component, call `useFetchMembersQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchMembersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchMembersQuery({
 *   variables: {
 *      user_id: // value for 'user_id'
 *      team_id: // value for 'team_id'
 *   },
 * });
 */
export function useFetchMembersQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchMembersQuery,
    FetchMembersQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchMembersQuery, FetchMembersQueryVariables>(
    FetchMembersDocument,
    options,
  );
}
export function useFetchMembersLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchMembersQuery,
    FetchMembersQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchMembersQuery, FetchMembersQueryVariables>(
    FetchMembersDocument,
    options,
  );
}
export type FetchMembersQueryHookResult = ReturnType<
  typeof useFetchMembersQuery
>;
export type FetchMembersLazyQueryHookResult = ReturnType<
  typeof useFetchMembersLazyQuery
>;
export type FetchMembersQueryResult = Apollo.QueryResult<
  FetchMembersQuery,
  FetchMembersQueryVariables
>;
