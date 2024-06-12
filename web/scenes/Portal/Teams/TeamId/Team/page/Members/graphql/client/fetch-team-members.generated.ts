/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type FetchTeamMembersQueryVariables = Types.Exact<{
  teamId: Types.Scalars["String"];
  invitesCondition?: Types.InputMaybe<
    Array<Types.Invite_Bool_Exp> | Types.Invite_Bool_Exp
  >;
  membersCondition?: Types.InputMaybe<
    Array<Types.Membership_Bool_Exp> | Types.Membership_Bool_Exp
  >;
}>;

export type FetchTeamMembersQuery = {
  __typename?: "query_root";
  invites: Array<{
    __typename?: "invite";
    id: string;
    email: string;
    expires_at: string;
  }>;
  members: Array<{
    __typename?: "membership";
    id: string;
    role: Types.Role_Enum;
    user: {
      __typename?: "user";
      name: string;
      email?: string | null;
      id: string;
      world_id_nullifier?: string | null;
    };
  }>;
};

export const FetchTeamMembersDocument = gql`
  query FetchTeamMembers(
    $teamId: String!
    $invitesCondition: [invite_bool_exp!]
    $membersCondition: [membership_bool_exp!]
  ) {
    invites: invite(
      where: {
        team_id: { _eq: $teamId }
        expires_at: { _gte: "now()" }
        _or: $invitesCondition
      }
    ) {
      id
      email
      expires_at
    }
    members: membership(
      where: { team_id: { _eq: $teamId }, _or: $membersCondition }
    ) {
      id
      role
      user {
        name
        email
        id
        world_id_nullifier
      }
    }
  }
`;

/**
 * __useFetchTeamMembersQuery__
 *
 * To run a query within a React component, call `useFetchTeamMembersQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchTeamMembersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchTeamMembersQuery({
 *   variables: {
 *      teamId: // value for 'teamId'
 *      invitesCondition: // value for 'invitesCondition'
 *      membersCondition: // value for 'membersCondition'
 *   },
 * });
 */
export function useFetchTeamMembersQuery(
  baseOptions: Apollo.QueryHookOptions<
    FetchTeamMembersQuery,
    FetchTeamMembersQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchTeamMembersQuery, FetchTeamMembersQueryVariables>(
    FetchTeamMembersDocument,
    options,
  );
}
export function useFetchTeamMembersLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    FetchTeamMembersQuery,
    FetchTeamMembersQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    FetchTeamMembersQuery,
    FetchTeamMembersQueryVariables
  >(FetchTeamMembersDocument, options);
}
export type FetchTeamMembersQueryHookResult = ReturnType<
  typeof useFetchTeamMembersQuery
>;
export type FetchTeamMembersLazyQueryHookResult = ReturnType<
  typeof useFetchTeamMembersLazyQuery
>;
export type FetchTeamMembersQueryResult = Apollo.QueryResult<
  FetchTeamMembersQuery,
  FetchTeamMembersQueryVariables
>;
