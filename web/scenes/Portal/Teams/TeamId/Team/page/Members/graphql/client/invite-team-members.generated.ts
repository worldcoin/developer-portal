/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type InviteTeamMembersMutationVariables = Types.Exact<{
  emails?: Types.InputMaybe<
    Array<Types.Scalars["String"]> | Types.Scalars["String"]
  >;
  team_id: Types.Scalars["String"];
}>;

export type InviteTeamMembersMutation = {
  __typename?: "mutation_root";
  invite_team_members?: {
    __typename?: "InviteTeamMembersOutput";
    emails?: Array<string> | null;
  } | null;
};

export const InviteTeamMembersDocument = gql`
  mutation InviteTeamMembers($emails: [String!], $team_id: String!) {
    invite_team_members(emails: $emails, team_id: $team_id) {
      emails
    }
  }
`;
export type InviteTeamMembersMutationFn = Apollo.MutationFunction<
  InviteTeamMembersMutation,
  InviteTeamMembersMutationVariables
>;

/**
 * __useInviteTeamMembersMutation__
 *
 * To run a mutation, you first call `useInviteTeamMembersMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInviteTeamMembersMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [inviteTeamMembersMutation, { data, loading, error }] = useInviteTeamMembersMutation({
 *   variables: {
 *      emails: // value for 'emails'
 *      team_id: // value for 'team_id'
 *   },
 * });
 */
export function useInviteTeamMembersMutation(
  baseOptions?: Apollo.MutationHookOptions<
    InviteTeamMembersMutation,
    InviteTeamMembersMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    InviteTeamMembersMutation,
    InviteTeamMembersMutationVariables
  >(InviteTeamMembersDocument, options);
}
export type InviteTeamMembersMutationHookResult = ReturnType<
  typeof useInviteTeamMembersMutation
>;
export type InviteTeamMembersMutationResult =
  Apollo.MutationResult<InviteTeamMembersMutation>;
export type InviteTeamMembersMutationOptions = Apollo.BaseMutationOptions<
  InviteTeamMembersMutation,
  InviteTeamMembersMutationVariables
>;
