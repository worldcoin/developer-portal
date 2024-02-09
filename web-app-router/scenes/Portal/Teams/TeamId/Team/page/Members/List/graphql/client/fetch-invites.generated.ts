/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchInvitesQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"];
}>;

export type FetchInvitesQuery = {
  __typename?: "query_root";
  invite: Array<{ __typename?: "invite"; email: string; expires_at: any }>;
};

export const FetchInvitesDocument = gql`
  query FetchInvites($teamId: String!) {
    invite(where: { team_id: { _eq: $teamId } }) {
      email
      expires_at
    }
  }
`;

/**
 * __useFetchInvitesQuery__
 *
 * To run a query within a React component, call `useFetchInvitesQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchInvitesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchInvitesQuery({
 *   variables: {
 *      teamId: // value for 'teamId'
 *   },
 * });
 */
export function useFetchInvitesQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchInvitesQuery,
    FetchInvitesQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchInvitesQuery, FetchInvitesQueryVariables>(
    FetchInvitesDocument,
    options,
  );
}
export function useFetchInvitesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchInvitesQuery,
    FetchInvitesQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchInvitesQuery, FetchInvitesQueryVariables>(
    FetchInvitesDocument,
    options,
  );
}
export type FetchInvitesQueryHookResult = ReturnType<
  typeof useFetchInvitesQuery
>;
export type FetchInvitesLazyQueryHookResult = ReturnType<
  typeof useFetchInvitesLazyQuery
>;
export type FetchInvitesQueryResult = Apollo.QueryResult<
  FetchInvitesQuery,
  FetchInvitesQueryVariables
>;
