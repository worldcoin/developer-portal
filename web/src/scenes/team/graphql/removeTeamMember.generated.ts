/* eslint-disable */
import * as Types from "@/graphql/graphql";

import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
const defaultOptions = {} as const;
export type RemoveTeamMemberMutationVariables = Types.Exact<{
  id: Types.Scalars["String"];
}>;

export type RemoveTeamMemberMutation = {
  __typename?: "mutation_root";
  member?: { __typename?: "membership"; id: string } | null;
};

export const RemoveTeamMemberDocument = gql`
  mutation RemoveTeamMember($id: String!) {
    member: delete_membership_by_pk(id: $id) {
      id
    }
  }
`;
export type RemoveTeamMemberMutationFn = Apollo.MutationFunction<
  RemoveTeamMemberMutation,
  RemoveTeamMemberMutationVariables
>;

/**
 * __useRemoveTeamMemberMutation__
 *
 * To run a mutation, you first call `useRemoveTeamMemberMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveTeamMemberMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeTeamMemberMutation, { data, loading, error }] = useRemoveTeamMemberMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useRemoveTeamMemberMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RemoveTeamMemberMutation,
    RemoveTeamMemberMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RemoveTeamMemberMutation,
    RemoveTeamMemberMutationVariables
  >(RemoveTeamMemberDocument, options);
}
export type RemoveTeamMemberMutationHookResult = ReturnType<
  typeof useRemoveTeamMemberMutation
>;
export type RemoveTeamMemberMutationResult =
  Apollo.MutationResult<RemoveTeamMemberMutation>;
export type RemoveTeamMemberMutationOptions = Apollo.BaseMutationOptions<
  RemoveTeamMemberMutation,
  RemoveTeamMemberMutationVariables
>;
