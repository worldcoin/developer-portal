/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchUserMembershipQueryVariables = Types.Exact<{
  user_id: Types.Scalars["String"];
  team_id: Types.Scalars["String"];
}>;

export type FetchUserMembershipQuery = {
  __typename?: "query_root";
  members: Array<{ __typename?: "membership"; id: string }>;
};

export const FetchUserMembershipDocument = gql`
  query FetchUserMembership($user_id: String!, $team_id: String!) {
    members: membership(
      where: {
        _and: { user_id: { _eq: $user_id }, team_id: { _eq: $team_id } }
      }
    ) {
      id
    }
  }
`;

/**
 * __useFetchUserMembershipQuery__
 *
 * To run a query within a React component, call `useFetchUserMembershipQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchUserMembershipQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchUserMembershipQuery({
 *   variables: {
 *      user_id: // value for 'user_id'
 *      team_id: // value for 'team_id'
 *   },
 * });
 */
export function useFetchUserMembershipQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchUserMembershipQuery,
    FetchUserMembershipQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    FetchUserMembershipQuery,
    FetchUserMembershipQueryVariables
  >(FetchUserMembershipDocument, options);
}
export function useFetchUserMembershipLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchUserMembershipQuery,
    FetchUserMembershipQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    FetchUserMembershipQuery,
    FetchUserMembershipQueryVariables
  >(FetchUserMembershipDocument, options);
}
export type FetchUserMembershipQueryHookResult = ReturnType<
  typeof useFetchUserMembershipQuery
>;
export type FetchUserMembershipLazyQueryHookResult = ReturnType<
  typeof useFetchUserMembershipLazyQuery
>;
export type FetchUserMembershipQueryResult = Apollo.QueryResult<
  FetchUserMembershipQuery,
  FetchUserMembershipQueryVariables
>;

