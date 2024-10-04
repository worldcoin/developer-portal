/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type LeaveTeamMutationVariables = Types.Exact<{
  user_id: Types.Scalars["String"]["input"];
  team_id: Types.Scalars["String"]["input"];
}>;

export type LeaveTeamMutation = {
  __typename?: "mutation_root";
  delete_membership?: {
    __typename?: "membership_mutation_response";
    affected_rows: number;
  } | null;
};

export const LeaveTeamDocument = gql`
  mutation LeaveTeam($user_id: String!, $team_id: String!) {
    delete_membership(
      where: { user_id: { _eq: $user_id }, team_id: { _eq: $team_id } }
    ) {
      affected_rows
    }
  }
`;
export type LeaveTeamMutationFn = Apollo.MutationFunction<
  LeaveTeamMutation,
  LeaveTeamMutationVariables
>;

/**
 * __useLeaveTeamMutation__
 *
 * To run a mutation, you first call `useLeaveTeamMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLeaveTeamMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [leaveTeamMutation, { data, loading, error }] = useLeaveTeamMutation({
 *   variables: {
 *      user_id: // value for 'user_id'
 *      team_id: // value for 'team_id'
 *   },
 * });
 */
export function useLeaveTeamMutation(
  baseOptions?: Apollo.MutationHookOptions<
    LeaveTeamMutation,
    LeaveTeamMutationVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<LeaveTeamMutation, LeaveTeamMutationVariables>(
    LeaveTeamDocument,
    options,
  );
}
export type LeaveTeamMutationHookResult = ReturnType<
  typeof useLeaveTeamMutation
>;
export type LeaveTeamMutationResult = Apollo.MutationResult<LeaveTeamMutation>;
export type LeaveTeamMutationOptions = Apollo.BaseMutationOptions<
  LeaveTeamMutation,
  LeaveTeamMutationVariables
>;
